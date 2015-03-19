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
        accessionToShortDescription: {},
        accessionToLongDescription: {},
        annotatedGenesCount: 0,
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

                // Launch jobs and vizualize data once they are done
                $.when.apply($, [jobGetBarSeqExperimentResultsProperties]).done( function(){
                    self.loading(false);
                    self.prepareVizData();

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
                            self.annotatedGenesCount ) )
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
                        "aaSorting": [[ 3, "asc" ], [0, "asc"]],
                        "aoColumns": [
                            { sTitle: "Description", mData: "experimentDescription"},
			    { sTitle: "Sick Genes",  mData: "sickGenes"},
                            { sTitle: "Sick Genes Long", mData: "sickGenesLong", bVisible: false, bSearchable: true},
                        ],
                        "oLanguage": {
                                    "sEmptyTable": "No experiments found!",
                                    "sSearch": "Search: "
                        },
                        'fnDrawCallback': eventsExperimentsTab
                    };

                    var experimentsTableData = [];
                    for(var expID in self.experiments){
                        var sickGenes = self.experimentToSickGenes[expID];

		
                        // Build concatenated list of gene references
                        var geneRefs = "";
                        for(var i = 0; i < sickGenes.length; i++){
                            gene = sickGenes[i];
                            if( i > 0 ) {
                                geneRefs += '<br />';
                            }                            
                            geneRefs += '<a class="show-gene' + self.pref  + '"'
                                + ' data-id="' + gene + '"'
                                + ' data-contigID="' + gene  + '"'
                                + ' data-geneIndex="' + gene  + '"'
                                + '>' + gene + '</a>';
                        }
 
                        // add table data row            
                        experimentsTableData.push(
                            {
                                'experimentDescription': expID, 
                                'sickGenes' : sickGenes.join(),
                                'sickGenesLong' : sickGenes.join(),
                                'geneRefs': geneRefs
                            }
                        );
                    };
                    experimentsTableSettings.aaData = experimentsTableData;
                    tableExperiments = tableExperiments.dataTable(domainTableSettings);

                    ///////////////////////////////////// Experiments Tab Events ////////////////////////////////////////////          
                    function eventsExperimentsTab() {
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
       
        prepareVizData: function(){
            var self = this;


            self.experiments = [];
	    self.genesToLog = [];
	    self.annotatedGenesCount = 0;

	    self.experimentsCount = self.barSeqExperimentResultsData.experiments.length;

	  
	    for(var iExp = 0 ; iExp < self.barSeqExperimentResultsData.experiments.length; iExp++){
                var experArray = self.barSeqExperimentResultsData.experiments[ iExp ][1];
                for(var i = 0 ; i < experArray.length; i++){
		    //typedef tuple<feature_ref f_ref,int strain_index,int count_begin,int count_end,float norm_log_ratio> bar_seq_result;

                    var geneID = experArray[i][0];
                    var logRatio = experArray[i][4];

		    self.annotatedGenesCount++;
                   
		    self.genesToLog.push( 
			{
			    'gene': geneID,
			    'logRatio': logRatio,
			    'experiment': experArray[i][0]
			}
		    );

		    console.log(iExp + " " + self.barSeqExperimentResultsData.experiments[ iExp ][0]);
		    if(logRatio < -2){
			if(typeof self.experimentToSickGenes[
			            self.barSeqExperimentResultsData.experiments[ iExp ][0]
			          ] === 'undefined'){
			    self.experimentToSickGenes[
				self.barSeqExperimentResultsData.experiments[ iExp ][0]
			    ] = [];
			}
			self.experimentToSickGenes[
			    self.barSeqExperimentResultsData.experiments[ iExp ][0]
			].push( geneID );
		    }
		    self.experiments.push( 
			self.barSeqExperimentResultsData.experiments[ iExp ][0] 
		    );
                }
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
