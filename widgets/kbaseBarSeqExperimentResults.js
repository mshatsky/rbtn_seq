/**
 * Output widget to vizualize BarSeqExperimentResults object.
 * Max Shatsky <mshatsky@lbl.gov>, John-Marc Chandonia <jmchandonia@lbl.gov>
 * @public
 */

(function($, undefined) {
    $.KBWidget({
        name: 'kbaseBarSeqExperimentResults',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.2',
        options: {
            barSeqExperimentResultsID: null,
            workspaceID: null,
            barSeqExperimentResultsVer: null,
            kbCache: null,
            workspaceURL: window.kbconfig.urls.workspace,
            loadingImage: "static/kbase/images/ajax-loader.gif",
            height: null,
	    maxDescriptionLength: 200
        },

        // Data for vizualization
        barSeqExperimentResultsData: null,
        genomeRef: null,
        genomeID: null,
        genomeName: null,
	genomeFeatures: [],
        accessionToShortDescription: {},
        accessionToLongDescription: {},
        annotatedGenes: {},
	experimentsCount: 0,
	experiments: [],
	experimentToSickGenes: {},
	genesToLog: [],

        init: function(options) {
            this._super(options);

            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);
	    
            return this;
        },

        loggedInCallback: function(event, auth) {
	    // error if not properly initialized
            if (this.options.barSeqExperimentResultsID == null) {
		this.showMessage("[Error] Couldn't retrieve BarSeqExperimentResults data.");
		return this;
            }

            // Create a new workspace client
            this.ws = new Workspace(this.options.workspaceURL, auth);
           
            // Let's go...
            this.render();           
           
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.ws = null;
            this.isLoggedIn = false;
            return this;
        },
  
        render: function(){
            var self = this;
            self.pref = this.uuid();
            self.loading(true);

            var container = this.$elem;
            var kbws = this.ws;

            var barSeqExperimentResultsRef = self.buildObjectIdentity(this.options.workspaceID, this.options.barSeqExperimentResultsID, this.options.barSeqExperimentResultsVer);
            kbws.get_objects([barSeqExperimentResultsRef], function(data) {

                self.barSeqExperimentResultsData = data[0].data;
                self.genomeRef = self.barSeqExperimentResultsData.genome;

                // Job to get properties of: name and id of the annotated genome
                var jobGetBarSeqExperimentResultsProperties = kbws.get_object_subset(
                    [
                        { 'ref':self.genomeRef, 'included':['/id'] },
                        { 'ref':self.genomeRef, 'included':['/scientific_name'] }
                    ], 
                    function(data){
                        self.genomeID = data[0].data.id;
                        self.genomeName = data[1].data.scientific_name;
                    }, 
                    function(error){
                        self.clientError(error);
                    }                    
                );

		//allow sorting for num with html (sType : "num-html")
		//http://datatables.net/plug-ins/sorting/num-html
		jQuery.extend( jQuery.fn.dataTableExt.oSort, {
		    "num-html-pre": function ( a ) {
			var x = String(a).replace( /<[\s\S]*?>/g, "" );
			return parseFloat( x );
		    },
		    
		    "num-html-asc": function ( a, b ) {
			return ((a < b) ? -1 : ((a > b) ? 1 : 0));
		    },
		    
		    "num-html-desc": function ( a, b ) {
			return ((a < b) ? 1 : ((a > b) ? -1 : 0));
		    }
		} );

                // Launch jobs and vizualize data once they are done
                $.when.apply($, [jobGetBarSeqExperimentResultsProperties]).done( function(){
                    self.loading(false);
                    self.prepareVizData();
		    self.prepareGenomeFeatures(kbws, self.genomeRef); 

                    ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
                    container.empty();
                    var tabPane = $('<div id="'+self.pref+'tab-content">');
                    container.append(tabPane);
                    tabPane.kbaseTabs({canDelete : true, tabs : []});                    
                    ///////////////////////////////////// Overview table ////////////////////////////////////////////           
                    var tabOverview = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Overview', content: tabOverview, canDelete : false, show: true});
                    var tableOver = $('<table class="table table-striped table-bordered" '+
                        'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+self.pref+'overview-table"/>');
                    tabOverview.append(tableOver);
                    tableOver
                        .append( self.makeRow( 
                            'Genome', 
                            $('<span />').append(self.genomeName).css('font-style', 'italic') ) )
                        .append( self.makeRow( 
                            'Genes analyzed', 
                            Object.keys(self.annotatedGenes).length ) )
                        .append( self.makeRow( 
                            'Number of Experiments', 
                            self.experimentsCount) );

                    ///////////////////////////////////// Experiments table ////////////////////////////////////////////          
                    var tabExperiments = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Experiments', content: tabExperiments, canDelete : false, show: false});
                    var tableExperiments = $('<table class="table table-striped table-bordered" '+
                        'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+self.pref+'experiments-table"/>');
                    tabExperiments.append(tableExperiments);
                    var experimentsTableSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaData": [],
                        "aaSorting": [[ 0, "desc" ]],
                        "aoColumns": [
                            { sTitle: "Description", mData: "experimentDescription"},
			    { sTitle: "Sick Genes",  mData: "sickGenes", sType : "num-html"},
                            { sTitle: "Sick Genes Long", mData: "sickGenesLong", bVisible: false, bSearchable: true},
                        ],
                        "oLanguage": {
                                    "sEmptyTable": "No experiments found!",
                                    "sSearch": "Search: "
                        },
                        'fnDrawCallback': eventsExperimentsTab
                    };

                    var experimentsTableData = [];
                    for(var i in self.experiments){
			var expID = self.experiments[ i ];
                        var sickGenes = [];

			if(typeof self.experimentToSickGenes[expID] !== 'undefined'){
			    sickGenes = self.experimentToSickGenes[expID];
			}

		
                        // Build reference to sick genes from a particular experiment
                        var genesRefs = 
                         '<a class="show-genes' + self.pref  + '"'
                                + ' data-expID="' + expID  + '"'
                                + '>' + sickGenes.length + '</a>';
 
                        // add table data row            
                        experimentsTableData.push(
                            {
                                'experimentDescription': expID, 
                                'sickGenes' : genesRefs,
                                'sickGenesLong' : sickGenes.length
                            }
                        );
                    };
                    experimentsTableSettings.aaData = experimentsTableData;
                    tableExperiments = tableExperiments.dataTable(experimentsTableSettings);

                    ///////////////////////////////////// Experiments Tab Events ////////////////////////////////////////////          
                    function eventsExperimentsTab() {
			$('.show-genes'+self.pref).unbind('click');
                        $('.show-genes'+self.pref).click(function() {

                            var expID = $(this).attr('data-expID');

                            if (tabPane.kbaseTabs('hasTab', expID)) {
                                tabPane.kbaseTabs('showTab', expID);
                                return;
                            }

                            ////////////////////////////// Build Genes table //////////////////////////////
			    var sickGenes = [];

			    if(typeof self.experimentToSickGenes[expID] !== 'undefined'){
				sickGenes = self.experimentToSickGenes[expID];
			    }



                            var tabContent = $("<div/>");

                            var tableGenes = $('<table class="table table-striped table-bordered" '+
                                'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="' + self.pref + expID + '-table"/>');
                            tabContent.append(tableGenes);
                            var geneTableSettings = {
                                "sPaginationType": "full_numbers",
                                "iDisplayLength": 10,
                                "aaData": [],
                                "aaSorting": [[ 0, "asc" ], [1, "desc"]],
                                "aoColumns": [
                                    {sTitle: "Gene", mData: "geneID"},
                                    {sTitle: "Description", mData: "geneDescription", sWidth:"30%"},
                                ],
                                "oLanguage": {
                                    "sEmptyTable": "No genes found!",
                                    "sSearch": "Search: "
                                },
				//'fnDrawCallback': eventsGeneTab
                            };

                            var geneTableData = [];
			    
                            for(var geneID in sickGenes){
				var geneIDtoDisplay = self.genomeFeatures[ sickGenes[geneID] ].id;

				var geneFunc = self.genomeFeatures[ sickGenes[geneID] ]['function'];
				if (!geneFunc){
				    geneFunc = '-';
				}

                                geneTableData.push({
                                    'geneID' : geneIDtoDisplay,
                                    'geneDescription' : geneFunc,
                                });
                            }

                            geneTableSettings.aaData = geneTableData;
                            tabPane.kbaseTabs('addTab', {tab: expID, content: tabContent, canDelete : true, show: true});
                            tableGenes.dataTable(geneTableSettings);
                        });
			eventsMoreDescription();
                    };


                    //////////////////// Events for Show More/less Description  ////////////////////////////////////////////       
                    function eventsMoreDescription() {
                        $('.show-more'+self.pref).unbind('click');
                        $('.show-more'+self.pref).click(function() {
                            var domainID = $(this).attr('data-id');
			    $(this).closest("td").html(self.accessionToLongDescription[domainID]);
			    eventsLessDescription();
			});
		    }
                    function eventsLessDescription() {
                        $('.show-less'+self.pref).unbind('click');
                        $('.show-less'+self.pref).click(function() {
                            var domainID = $(this).attr('data-id');
			    $(this).closest("td").html(self.accessionToShortDescription[domainID]);
			    eventsMoreDescription();
			});
		    }
                });                
            });
        },
       
	prepareGenomeFeatures: function(kbws, gnmref) {//self.kbws self.genomeRef 
            var self = this;
            var subsetRequests = [{ref: gnmref, included:
				   ["/features/[*]/aliases",
				    "/features/[*]/annotations",
				    "/features/[*]/function",
				    "/features/[*]/id",
				    "/features/[*]/location",
				    "/features/[*]/protein_translation_length",
				    "/features/[*]/dna_translation_length",
				    "/features/[*]/type"]
				  }];
            kbws.get_object_subset(subsetRequests, 
				   function(data) {
				       self.genomeFeatures = data[0].data.features;
				   },
				   function(error){
				       self.clientError(error);
				   }
				  );                            
	},
	
        prepareVizData: function(){
            var self = this;


            self.experiments = [];
	    self.genesToLog = [];
	    self.annotatedGenes = {};

	    self.experimentsCount = self.barSeqExperimentResultsData.experiments.length;

	  
	    for(var iExp = 0 ; iExp < self.barSeqExperimentResultsData.experiments.length; iExp++){
                var experArray = self.barSeqExperimentResultsData.experiments[ iExp ][1];
                for(var i = 0 ; i < experArray.length; i++){
		    //typedef tuple<feature_ref f_ref,int strain_index,int count_begin,int count_end,float norm_log_ratio> bar_seq_result;

                    var geneID = experArray[i][0];
                    var logRatio = experArray[i][4];

		    self.annotatedGenes[ geneID ] = 1;
                   
		    self.genesToLog.push( 
			{
			    'gene': geneID,
			    'logRatio': logRatio,
			    'experiment': experArray[i][0].name
			}
		    );

		    //console.log(iExp + " " + self.barSeqExperimentResultsData.experiments[ iExp ][0]);
		    if(logRatio < -2){
			if(typeof self.experimentToSickGenes[
			        self.barSeqExperimentResultsData.experiments[ iExp ][0].name
			    ] === 'undefined'){
			    self.experimentToSickGenes[
				self.barSeqExperimentResultsData.experiments[ iExp ][0].name
			    ] = [];
			}
			self.experimentToSickGenes[
			    self.barSeqExperimentResultsData.experiments[ iExp ][0].name
			].push( geneID );
		    }
	        }
		self.experiments.push( 
		    self.barSeqExperimentResultsData.experiments[ iExp ][0].name
		);
            }
        },

        makeRow: function(name, value) {
            var $row = $("<tr/>")
                .append($("<th />").css('width','20%').append(name))
                .append($("<td />").append(value));
            return $row;
        },
	
        getData: function() {
            return {
                type: 'BarSeqExperimentResults',
                id: this.options.barSeqExperimentResultsID,
                workspace: this.options.workspaceID,
                title: 'BarSeq Results'
            };
        },

        loading: function(isLoading) {
            if (isLoading)
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");
            else
                this.hideMessage();                
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function() {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        },

        buildObjectIdentity: function(workspaceID, objectID, objectVer, wsRef) {
            var obj = {};
            if (wsRef) {
                obj['ref'] = wsRef;
            } else {
                if (/^\d+$/.exec(workspaceID))
                    obj['wsid'] = workspaceID;
                else
                    obj['workspace'] = workspaceID;

                // same for the id
                if (/^\d+$/.exec(objectID))
                    obj['objid'] = objectID;
                else
                    obj['name'] = objectID;
                
                if (objectVer)
                    obj['ver'] = objectVer;
            }
            return obj;
        },        

        clientError: function(error){
            this.loading(false);
            this.showMessage(error.error.error);
        }        

    });
})( jQuery );
