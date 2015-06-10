/**
 * Widget to vizualize BarSeqExperimentResults object.
 * Max Shatsky <mshatsky@lbl.gov>, John-Marc Chandonia <jmchandonia@lbl.gov>
 * @public
 */



(function ($) {
    $.scatterPlots = function () {
        var sPlots = {
            
            sData: {
                "values": {},
                "dataSetObjs": [],
                "dataPointObjs": []
            },
            selectedSet: [],
            maxSelection: 10,
            hideDiagonal: 1, // toggles between showing a full square and just the upper diagonal
            container_dimensions: {}, //= {width: self.$elem.width() - 120, height: self.$elem.width() - 120};
            margins: {}, //= {top: 60, right: 60, bottom: 60, left: 60};
            chart_dimensions: {},
            padding: 25, // area between cells
            cellAreaMargin: 16, // adds a bit to the min/max range of cell data so that data points aren't on the boarders
                 
            /*
             * Tag data structure
             */
            tags: {},
            activeTags: [],
            tagsByDataPointName: {}, // {"name" : [] array of tags }

            //Declare dataTables handle for the dataPointsTable to make sure it is only created once
            //otherwise dataTables freaks out
            dataPointsTable: 0,
            
            plotAreaContainer: $('<div id="plotareaContainer"></div>'),

/*
<script src="http://0.0.0.0:8080/assets/js/DataScatter.js"></script> \
<link href="http://0.0.0.0:8080/assets/css/kbase-common.css" rel="stylesheet"> \
            <link href="http://0.0.0.0:8080/assets/css/identity.css" rel="stylesheet"> \
<link type="text/css" rel="stylesheet" href="http://0.0.0.0:8080/assets/css/DataScatter2.css"> \
<script src="http://ajax.aspnetcdn.com/ajax/jquery/jquery-1.9.0.js"></script> \
<script src="http://ajax.aspnetcdn.com/ajax/jquery.dataTables/1.9.4/jquery.dataTables.js"></script> \

<script src="http://0.0.0.0:8080/assets/js/d3.v2.js"></script> \
<script src="http://0.0.0.0:8080/assets/js/bootstrap.js"></script> \
<script src="http://0.0.0.0:8080/assets/js/bootstrapx-clickover.js"></script> \
<link type="text/css" href="http://ajax.aspnetcdn.com/ajax/jquery.dataTables/1.9.4/css/jquery.dataTables.css" rel="stylesheet">  \
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css"> \
<link href="http://0.0.0.0:8080/assets/css/bootstrap-responsive.min.css" rel="stylesheet"> \



<div class="container"> \
      <div class="row"> \
                  </div> \


*/
            plotContainer: '\
<link type="text/css" rel="stylesheet" href="http://0.0.0.0:8080/assets/css/DataScatter2.css"> \
\
      <div class="span9"> \
          <div id="plotarea"> \
          </div> \
      </div> \
      <div id="tooltip" style="position: absolute; z-index: 10; visibility: hidden; opacity: 0.8; background-color: rgb(34, 34, 34); color: rgb(255, 255, 255); padding: 0.5em;"> \
      </div> \
',
   /*         
                       plotContainer: '\
<script src="http://ajax.aspnetcdn.com/ajax/jquery/jquery-1.9.0.js"></script> \
<script src="http://ajax.aspnetcdn.com/ajax/jquery.dataTables/1.9.4/jquery.dataTables.js"></script> \
<script src="http://0.0.0.0:8080/assets/js/d3.v2.js"></script> \
<script src="http://0.0.0.0:8080/assets/js/bootstrap.js"></script> \
<script src="http://0.0.0.0:8080/assets/js/bootstrapx-clickover.js"></script> \
<link type="text/css" href="http://ajax.aspnetcdn.com/ajax/jquery.dataTables/1.9.4/css/jquery.dataTables.css" rel="stylesheet">  \
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css"> \
<link href="http://0.0.0.0:8080/assets/css/bootstrap-responsive.min.css" rel="stylesheet"> \
<link href="http://0.0.0.0:8080/assets/css/identity.css" rel="stylesheet"> \
<link type="text/css" rel="stylesheet" href="http://0.0.0.0:8080/assets/css/DataScatter2.css"> \
\
<div class="container"> \
      <div class="row"> \
        <div class="span9"> \
          <div id="plotarea"> \
          </div> \
        </div> \
        <div class="span3"> \
          <ul class="nav nav-tabs" id="myTab"> \
            <li class="active"><a href="#dataSets" data-toggle="tab">Data Sets</a></li> \
            <li><a href="#dataPointTags" data-toggle="tab">Tags</a></li> \
          </ul> \
          <div class="tab-content"> \
            <div class="tab-pane active" id="dataSets"> \
              <table id="key" class="accordian"> \
              </table> \
            </div> \
            <div class="tab-pane" id="dataPointTags"> \
              <form class="form-horizontal"> \
                <input class="span3" type="text" id="inputTag" placeholder="tag name" data-provide="typeahead" autocomplete="off" onchange="check_tag()"> \
                <textarea class="span3" rows="3" id="inputTagDataPointNames" placeholder="data point names..."></textarea> \
                <button id="addTagButton"class="btn btn-primary btn-block" type="button" onclick="addTag()">Add</button> \
                <table id="tagTable"> \
                </table> \
            </div> \
          </div> \
        </div> \
      </div> \
\
      <div class="row"> \
        <div id="this.dataPointsTableContainer" class="span9"> \
          <table id="dataPointsTable"> \
          </table> \
        </div> \
      </div> \
\
      <div class="row"> \
        <div class="span9"> \
          <div id="table"> \
          </div> \
        </div> \
      </div> \
\
      <div id="tooltip" style="position: absolute; z-index: 10; visibility: hidden; opacity: 0.8; background-color: rgb(34, 34, 34); color: rgb(255, 255, 255); padding: 0.5em;"> \
      </div> \
',
 */
            d3Plots: function (widthX) {

                /*
                 * KBase Data Scatter Plot Widget
                 * ------------------------------
                 * This is designed to be an insertable widget, but is being implemented 
                 * as a standalone page for now. 
                 * 
                 * This widget is designed to allow users to explore multiple data sets that
                 * share a common set of data points. These data points are plotted in multiple
                 * scatter plots, allowing the joint visualization of multiple dimensions 
                 * simultaneously. 
                 * 
                 * This widget is based off the d3 scatterplot example by Mike Bostock. 
                 * http://bl.ocks.org/mbostock/4063663
                 * 
                 * Paramvir Dehal
                 * psdehal@lbl.gov
                 * Physical Biosciences Division
                 * Lawrence Berkeley National Lab
                 * DOE KBase
                 *
                 * TODO:
                 *      - Settings tab 
                 *      - Marcin's Wordcloud code
                 *      - Cross browser, cross platform fixes
                 *      - edit tag lists, click and stay highlighted, add to tags
                 *      - More user defined fields in upload tabfile "systematic name", etc
                 */

                //var container_dimensions = {width: 900, height: 900},
                //margins = {top: 60, right: 60, bottom: 60, left: 60},
                //this.container_dimensions = {width: self.$elem.width() - 120, height: self.$elem.width() - 120};
                this.container_dimensions = {width: widthX, height: widthX};
                this.margins = {top: 60, right: 60, bottom: 60, left: 60};
                this.chart_dimensions = {
                    width: this.container_dimensions.width - this.margins.left - this.margins.right,
                    height: this.container_dimensions.height - this.margins.top - this.margins.bottom
                };

                


                // utility function to move elements to the front
                d3.selection.prototype.moveToFront = function () {
                    return this.each(function () {
                        this.parentNode.appendChild(this);
                    });
                };

                
                
                //reset some variables and remove everything made by the previous datafile 

                selectedSet = [];
                selectedDataPoints = {}

                $("#key").empty();
                $("#dataPointsTableContainer").empty();
                $("#plotarea").empty();


                //Drawing the key

                var key_items = d3.select("#key")
                        .selectAll("table")
                        .data(this.sData.dataSetObjs)
                        .enter()
                        .append("tr")
                        .attr("class", "key_exp")
                        .attr("id", function (d) {
                            return d.dataSetId
                        })
                        .on("click", function (d) {
                            $('#loading').removeClass('hidden');
                            setTimeout(function () {
                                this.set_selected_dataSet(d.dataSetId);
                                $('#loading').addClass('hidden');
                            }, 10);
                        });

                key_items.append("td")
                        .attr("id", function (d) {
                            return "key_count_" + d.dataSetId
                        })
                        .attr("class", function (d) {
                            return "key_count " + d.dataSetId
                        });

                key_items.append("td")
                        .attr("id", function (d) {
                            return "key_square_" + d.dataSetId
                        })
                        .attr("class", function (d) {
                            return "key_square " + d.dataSetId
                        });

                key_items.append("td")
                        .attr("id", function (d) {
                            return "key_label_" + d.dataSetId
                        })
                        .attr("class", "key_label")
                        .text(function (d) {
                            return d.dataSetName
                        });



                // Making the dataPointsTable
                $("#dataPointsTableContainer").append('<table id="dataPointsTable"></table>');
                $("#dataPointsTable").append("<thead><tr><th>Name</th><th>Description</th></tr></thead>");

                for (var i in this.sData.dataPointObjs) {
                    var obj = this.sData.dataPointObjs[i];
                    var str = "<td>" + obj.dataPointName + "</td><td>" + obj.dataPointDesc + "</td>";
                    $("#dataPointsTable").append("<tr id=" + obj.dataPointName + ">" + str + "</tr>");
                }

                this.dataPointsTable = $('#dataPointsTable').dataTable({"bPaginate": true,
                    "bFilter": true,
                    "asSorting": [[1, "asc"]]
                });
            

                setDataTablesHover();


                var scatterplot = d3.select("#plotarea")
                        .append("svg")
                        .attr("width", this.container_dimensions.width)
                        .attr("height", this.container_dimensions.height)
                        .append("g")
                        .attr("transform", "translate(" + this.margins.left + "," + this.margins.top + ")")
                        .attr("id", "scatterplot");

                load_tags();
                $("#loading").addClass("hidden");

            
                
                function setDataTablesHover() {
                    /*
                     $(dataPointsTable.fnGetNodes()).hover(
                            function () {
                                $(this).css("background", "orange");
                                var id = $(this).attr("id");
                                d3.selectAll("circle#" + id).classed("highlighted", 1)
                                        .attr("r", 6)
                                        .moveToFront();
                            },
                            function () {
                                $(this).css("background", "");
                                var id = $(this).attr("id");
                                d3.selectAll("circle#" + id).classed("highlighted", 0)
                                        .attr("r", 4);
                            }
                    );
                    */
                }

            
                /*
                 * check_tag()
                 * ----------
                 * check the input tag to see if it already exists, if so
                 * enter the dataPointNames associated with the tag into the
                 * #inputTagDataPointNames textbox and change the value of
                 * #addTagButton to "Replace"
                 *
                 */

                function check_tag() {
                    var tagName = $('#inputTag').val();
                    var tagExists = false;

                    for (var i in this.tags) {
                        if (i === tagName) {
                            tagExists = true;
                        }
                    }

                    if (tagExists) {
                        $('#inputTagDataPointNames').val(this.tags[i]['dataPointNames'].join("\n"));
                        $('#addTagButton').html("Replace");
                    } else {
                        $('#addTagButton').html("Add");
                    }
                }

                /*
                 * addTag()
                 * --------
                 * processes form input for adding a tag and updates the tag list table
                 *
                 */
                
                function addTag() {
                    var tagName = $('#inputTag').val();
                    var taggedDataPointNames = $('#inputTagDataPointNames').val().split(/[, ]|\r\n|\n|\r/g);

                    //Need to add really user data entry checking
                    if ($('#inputTagDataPointNames').val() === "" || taggedDataPointNames.length === 0) {
                        return;
                    }
                    var validDataPointNames = [];
                    var count = 0;
                    for (var i = 0; i < taggedDataPointNames.length; i++) {
                        if (this.sData.values[ taggedDataPointNames[i] ] != undefined) {
                            if (true) {
                                validDataPointNames.push(taggedDataPointNames[i]);
                            }
                        } else {
                            console.log("undefined: [" + taggedDataPointNames[i] + "]");
                            count++;
                        }
                    }
                    console.log("Tag: " + tagName + " Num: " + taggedDataPointNames.length + " failed: " + count);
                    var tagExists = false;
                    var tagActive = false;
                    var color = "";

                    for (var i in this.tags) {
                        if (i === tagName) {
                            tagExists = true;
                            for (var j = 0; j < this.activeTags.length; j++) {
                                if (this.activeTags[j]["id"] === tagName) {
                                    tagActive = true;
                                    color = this.activeTags[j]["color"];
                                    unset_tag_color(tagName);
                                }
                            }
                        }
                    }



                    this.tags[tagName] = {"status": 0,
                        "dataPointNames": []
                    };


                    for (var i = 0; i < validDataPointNames.length; i++) {
                        this.tags[ tagName ]["dataPointNames"].push(validDataPointNames[i]);
                        if (this.tagsByDataPointName[validDataPointNames[i]] == undefined) {
                            this.tagsByDataPointName[validDataPointNames[i]] = [];
                        }
                        this.tagsByDataPointName[validDataPointNames[i]].push(tagName);
                    }

                    /*
                     * if tag exists, 
                     * call color_by_active tags if replaced tag is active
                     * return without redrawing the table entry
                     */
                    if (tagExists) {
                        if (tagActive) {
                            set_tag_color(color, tagName);
                        }
                        return;
                    }


                    var tagTable = $('#tagTable')
                            .append("<tr class='tag_exp' id='" + tagName + "'>" +
                                    "<td class='tag_order' id='tag_order_" + tagName + "'></td>" +
                                    "<td id='colorSelect_" + tagName + "' class='tag_square'></td>" +
                                    "<td class='key_label' id='key_label_" + tagName + "'>" + tagName +
                                    "</td>" +
                                    "</tr>");
                    //
                    var colorTable = "<table id='colorSelect'>" +
                            "<tr>" +
                            "<td style='background-color:#1f77b4'></td>" +
                            "<td style='background-color:#99ccff'></td>" +
                            "<td style='background-color:#ff7f0e'></td>" +
                            "<td style='background-color:#ffbb78'></td>" +
                            "</tr><tr>" +
                            "<td style='background-color:#2ca02c'></td>" +
                            "<td style='background-color:#98df8a'></td>" +
                            "<td style='background-color:#d62728'></td>" +
                            "<td style='background-color:#ff9896'></td>" +
                            "</tr><tr>" +
                            "<td style='background-color:#9467bd'></td>" +
                            "<td style='background-color:#c5b0d5'></td>" +
                            "<td style='background-color:#8c564b'></td>" +
                            "<td style='background-color:#c49c94'></td>" +
                            "</tr><tr>" +
                            "<td style='background-color:#e377c2'></td>" +
                            "<td style='background-color:#f7b6d2'></td>" +
                            "<td style='background-color:#7f7f7f'></td>" +
                            "<td style='background-color:#c7c7c7'></td>" +
                            "</tr><tr>" +
                            "<td id='colorNone' colspan=4><button class='btn btn-mini btn-block' type='button'>None</button></td>" +
                            "</tr>"
                    "</table>";


                    tmp = $('<div>' + colorTable + '</div>');

                    tmp.find('td')
                            .attr('onclick', "set_tag_color($(this).css('background-color'), '" + tagName + "')");

                    tmp.find("#colorNone")
                            .attr('onclick', 'unset_tag_color("' + tagName + '")');

                    $('#colorSelect_' + tagName).clickover({
                        html: true,
                        placement: "bottom",
                        title: 'tag color<button type="button" class="close" data-dismiss="clickover">&times;</button>',
                        trigger: 'manual',
                        width: '160px',
                        content: tmp.html()
                    });

                }

                /*
                 * set_tag_color(tagColor, id)
                 * ----------------------
                 * takes input color 
                 * and applies it to the dataPoints with the "tag" (id)
                 *
                 * tagColor : color you want all the dataPoints with "tag" to be colored
                 * id : id of the tag
                 * 
                 * 
                 * returns nothing
                 */

                function set_tag_color(tagColor, id) {

                    $('#tag_' + id).remove();
                    $("<style type='text/css' id='tag_" + id + "'>.tag_" + id + "{ fill: " + tagColor + "; fill-opacity: .7; }</style>").appendTo("head");

                    $('#colorSelect_' + id).css("background-color", tagColor);

                    for (var i = 0; i < this.tags[id]["dataPointNames"].length; i++) {
                        d3.selectAll("circle#" + this.tags[id]["dataPointNames"][i])
                                .classed("tag_" + id, 1)
                                .moveToFront();
                    }

                    for (var i = 0; i < this.activeTags.length; i++) {
                        if (this.activeTags[i]["id"] === id) {
                            this.activeTags.splice(i, 1);
                        }
                    }
                    this.activeTags.push({"id": id, "color": tagColor});
                    $('#tag_order_' + id).html(this.activeTags.length);

                    update_tag_order();

                }

                /*
                 * unset_tag_color(id)
                 * -------------------
                 * takes input tag and unapplies the tag color to all dataPoints with that tag
                 * note: coloring by other tags will still apply
                 */

                function unset_tag_color(id) {
                    $('#tag_' + id).remove(); //removes existing css styling from dom

                    $('#colorSelect_' + id).css("background-color", "");

                    for (var i = 0; i < this.tags[id]["dataPointNames"].length; i++) {
                        d3.selectAll("circle#" + this.tags[id]["dataPointNames"][i])
                                .classed("tag_" + id, 0);
                    }
                    for (var i = 0; i < this.activeTags.length; i++) {
                        if (this.activeTags[i]["id"] === id) {
                            this.activeTags.splice(i, 1);
                        }
                    }

                    $('#tag_order_' + id).html('');
                    update_tag_order();
                }

                /*
                 * update_tag_order()
                 * ------------------
                 * updates the html doc to show the tag selection order
                 *
                 * returns nothing
                 */

                function update_tag_order() {
                    for (var i = 0; i < this.activeTags.length; i++) {
                        $('#tag_order_' + this.activeTags[i]["id"]).html(i + 1);
                    }
                }

                
                function load_tags() {
                    var tmpTags = {
                        "General_Secretion": "SO_0165\nSO_0166\nSO_0167\nSO_0168\nSO_0169\nSO_0170\nSO_0172\nSO_0173\nSO_0175\nSO_0176",
                        "Megaplasmid": "SO_A0001"
                    };

                    var source = [];
                    for (var i in tmpTags) {
                        $('#inputTag').val(i);
                        $('#inputTagDataPointNames').val(tmpTags[i]);
                        addTag();
                        source.push(i);
                    }

                    $('#inputTag').typeahead({
                        source: source
                    });
                }

           
            },
            /*
             * color_by_active_tags() 
             * ----------------------
             * re-colors all dataPoints using the active tags in activeTags object
             *
             * returns nothing
             */

            color_by_active_tags: function () {
                for (var i = 0; i < this.activeTags.length; i++) {

                    var id = this.activeTags[i]["id"];
                    var color = this.activeTags[i]["color"];

                    $('#tag_' + id).remove();
                    $("<style type='text/css' id='tag_" + id + "'>.tag_" +
                            id + "{ fill: " +
                            color + "; fill-opacity: .7; }</style>")
                            .appendTo("head");

                    for (var t = 0; t < this.tags[id]["dataPointNames"].length; t++) {
                        d3.selectAll("circle#" + this.tags[id]["dataPointNames"][t])
                                .classed("tag_" + id, 1)
                                .moveToFront();
                    }
                }
            },

            cross: function (arrayA, arrayB) {
                var matrixC = [], sizeA = arrayA.length, sizeB = arrayB.length, i, j;
                if (this.hideDiagonal) {
                    for (i = 0; i < sizeA; i++) {
                        for (j = i + 1; j < sizeB; j++) {
                            matrixC.push({x: arrayA[i], i: i, y: arrayB[j], j: j});
                        }
                    }
                } else {
                    for (i = -1; ++i < sizeA; ) {
                        for (j = -1; ++j < sizeB; ) {
                            matrixC.push({x: arrayA[i], i: i, y: arrayB[j], j: j});
                        }
                    }
                }
                return matrixC;
            },

            makePlot: function () {
                var self=this;
                
                d3.select("svg").remove();
                if (self.hideDiagonal) {
                    numCells = self.selectedSet.length - 1;
                    xCells = self.selectedSet.slice(0, -1);
                    yCells = self.selectedSet.slice(1);
                } else {
                    numCells = self.selectedSet.length;
                    xCells = self.selectedSet;
                    yCells = self.selectedSet;
                }

                var cellSize = self.chart_dimensions.width / numCells;
                scatterplot = d3.select("#plotarea")
                        .append("svg")
                        .attr("width", self.container_dimensions.width)
                        .attr("height", self.container_dimensions.height)
                        .append("g")
                        .attr("transform", "translate(" + self.margins.left + "," + self.margins.top + ")")
                        .attr("id", "scatterplot");
                var x_axis_scale = {},
                        y_axis_scale = {};
                
                for (var i = 0; i < self.selectedSet.length; i++) {
                    var dataSet =self.selectedSet[i];
                      console.log("makePlot4: selSet: "+JSON.stringify(dataSet));    
                      console.log("makePlot5: selSet: "+JSON.stringify(self.sData.dataSetObjs[ dataSet ]));    
                
                    //going to add a bit of this.padding to the min and max value
                    var min = self.sData.dataSetObjs[dataSet].minValue - (((cellSize + self.cellAreaMargin) / cellSize - 1) * (self.sData.dataSetObjs[dataSet].maxValue - self.sData.dataSetObjs[dataSet].minValue)) / 2;
                    var max = parseFloat(self.sData.dataSetObjs[dataSet].maxValue) + parseFloat((((cellSize + self.cellAreaMargin) / cellSize - 1) * (self.sData.dataSetObjs[dataSet].maxValue - self.sData.dataSetObjs[dataSet].minValue)) / 2);
                    x_axis_scale[dataSet] = d3.scale.linear()
                            .domain([min, max])
                            .range([self.padding / 2, cellSize - self.padding / 2]);
                    y_axis_scale[dataSet] = d3.scale.linear()
                            .domain([min, max])
                            .range([cellSize - self.padding / 2, self.padding / 2]);
                };
                var axis = d3.svg.axis();
                //.ticks(5)
                //.tickSize( chart_dimensions.width );


                scatterplot.selectAll("g.x.axis")
                        .data(xCells)
                        .enter().append("g")
                        .attr("class", "x axis")
                        .attr("transform", function (d, i) {
                            return "translate(" + i * cellSize + "," + "0" + ")";
                        })
                        .each(function (d) {
                            d3.select(this).call(axis.scale(x_axis_scale[d]).orient("top"));
                        });
                scatterplot.selectAll("g.y.axis")
                        .data(yCells)
                        .enter().append("g")
                        .attr("class", "y axis")
                        .attr("transform", function (d, i) {
                            return "translate(0," + (yCells.length - 1 - i) * cellSize + ")";
                        })
                        .each(function (d) {
                            d3.select(this).call(axis.scale(y_axis_scale[d]).orient("left"));
                        });
                var brush = d3.svg.brush()
                        .on("brushstart", brushstart)
                        .on("brush", brush)
                        .on("brushend", brushend);
                var cell = scatterplot.selectAll("g.cell")
                        .data(self.cross(self.selectedSet, self.selectedSet))
                        .enter()
                        .append("g")
                        .attr("class", "cell")
                        .attr("transform", function (d) {
                            return "translate(" + d.i * cellSize + "," + (self.selectedSet.length - 1 - d.j) * cellSize + ")";
                        })
                        .each(plotCell);
                // Titles for the diagonal.
                /*cell.filter(function(d) { return d.i == d.j-1; })
                 .append("text")
                 .attr("x", cellSize/2)
                 .attr("y", cellSize)
                 .attr("dy", ".71em")
                 .attr("text-anchor", "middle")
                 .text(function(d) { return sData.dataSetObjs[d.x].dataSetName; });
                 
                 cell.filter(function(d) { return d.i == d.j-1; })
                 .append("text")
                 //.attr("x", cellSize)
                 //.attr("y", cellSize/2)
                 .attr("text-anchor", "middle")
                 .attr("dy", ".71em")
                 .attr("transform", "translate(" + cellSize + "," + cellSize/2 + ") rotate(-90)")
                 .text(function(d) { return sData.dataSetObjs[d.y].dataSetName; });
                 */

                cell.append("text")
                        .attr("x", cellSize / 2)
                        .attr("y", cellSize)
                        .attr("text-anchor", "middle")
                        .text(function (d) {
                            return self.sData.dataSetObjs[d.x].dataSetName;
                        });
                cell.append("text")
                        .attr("text-anchor", "middle")
                        .attr("transform", "translate(" + cellSize + "," + cellSize / 2 + ") rotate(-90)")
                        .text(function (d) {
                            return self.sData.dataSetObjs[d.y].dataSetName;
                        });
                        
                        
                function brushstart(p) {
                    if (brush.data !== p) {
                        cell.call(brush.clear());
                        brush.x(x_axis_scale[p.x]).y(y_axis_scale[p.y]).data = p;
                    }
                }

                function brush(p) {
                    var e = brush.extent(); //2d array of x,y coords for select rectangle

                    //can get a speed up by just selecting the circles from the cell
                    scatterplot.selectAll("circle").classed("selected", function (d) {
                        if (e[0][0] <= self.sData.values[d.dataPointName][p.x] && self.sData.values[d.dataPointName][p.x] <= e[1][0]
                                && e[0][1] <= self.sData.values[d.dataPointName][p.y] && self.sData.values[d.dataPointName][p.y] <= e[1][1]) {

                            return 1;
                        }
                        else {
                            return 0;
                        }

                    });
                }

                function brushend() {
                    var tableData = [];
                    var uniquePoints = [];
                    var points = [];
                    var nTrArray = [];
                    if (brush.empty()) {
                        scatterplot.selectAll("circle").classed("selected", 0);
                        self.dataPointsTable.fnClearTable();
                        for (var d in self.sData.dataPointObjs) {
                            var tmp = [self.sData.dataPointObjs[d].dataPointName, self.sData.dataPointObjs[d].dataPointDesc];
                            tableData.push(tmp);
                        }
                        nTrArray = self.dataPointsTable.fnAddData(tableData);
                        for (var i in nTrArray) {
                            self.dataPointsTable.fnSettings().aoData[ i ].nTr.id = self.sData.dataPointObjs[i].dataPointName;
                        }
                        setDataTablesHover();
                    }
                    else {
                        d3.selectAll(".selected").classed("selected", function (d) {
                            points[d.dataPointName] = d.dataPointName;
                            return 1;
                        }).moveToFront();
                        for (var i in points) {
                            uniquePoints.push(points[i]);
                        }

                        self.dataPointsTable.fnClearTable();
                        for (var d in uniquePoints) {
                            var tmp = [uniquePoints[d], self.sData.values[ uniquePoints[d] ].dataPointDesc];
                            tableData.push(tmp);
                        }

                        nTrArray = self.dataPointsTable.fnAddData(tableData);
                        for (var i in nTrArray) {
                            self.dataPointsTable.fnSettings().aoData[ i ].nTr.id = uniquePoints[i];
                        }
                        setDataTablesHover();
                    }

                }
                
                function plotCell(cellData) {
                    var cell = d3.select(this);
                    cell.append("rect")
                            .attr("class", "frame")
                            .attr("x", self.padding / 2)
                            .attr("y", self.padding / 2)
                            .attr("width", cellSize - self.padding)
                            .attr("height", cellSize - self.padding);
                    cell.call(brush.x(x_axis_scale[cellData.x]).y(y_axis_scale[cellData.y]));
                    // Have to put circles in last so that they 
                    // are in the front for the mouseover to work

                    cell.selectAll("circle")
                            .data(self.sData.dataPointObjs)
                            .enter()
                            .append("circle")
                            .attr("id", function (d) {
                                return d.dataPointName;
                            })
                            .attr("cx", function (d) {
                                return x_axis_scale[cellData.x](self.sData.values[d.dataPointName][cellData.x]);
                            })
                            .attr("cy", function (d) {
                                return y_axis_scale[cellData.y](self.sData.values[d.dataPointName][cellData.y]);
                            })
                            .attr("r", 4)
                            .on("mouseover", function (d) {
                                var id = $(this).attr("id");
                                var tagStr = "";
                                d3.selectAll("circle#" + id).classed("highlighted", 1)
                                        .attr("r", 6)
                                        .moveToFront();
                                d3.selectAll("tr#" + id).style("background", "orange");
                                if (self.tagsByDataPointName[id] != undefined) {
                                    tagStr = "<br>Tags: " + self.tagsByDataPointName[id].join(", ");
                                }
                                $('#tooltip').html(id + ": " + d.dataPointDesc + tagStr);
                                return $('#tooltip').css("visibility", "visible");
                            })
                            .on("mousemove", function () {
                                //does not work properly on KBase: 
                                return $('#tooltip').css("top", (d3.event.pageY + 15) + "px").css("left", (d3.event.pageX - 10) + "px");
                                //var matrix = this.getScreenCTM()
                                //        .translate(+this.getAttribute("cx"), +this.getAttribute("cy"));
                                //return $('#tooltip').css("top", (window.pageXOffset + matrix.e + 15) + "px").css("left", (window.pageYOffset + matrix.f - 10) + "px");
                                //return $('#tooltip').css("top", (this.getAttribute("cx") + 15) + "px").css("left", (this.getAttribute("cy") - 10) + "px");
                            })
                            .on("mouseout", function (d) {
                                var id = $(this).attr("id");
                                d3.selectAll("circle#" + id).classed("highlighted", 0)
                                        .attr("r", 4);
                                d3.selectAll("tr#" + id).style("background", "");
                                return $('#tooltip').css("visibility", "hidden");
                            });
                }
            },
            set_selected_dataSet: function (id) {
// flag for dataSets to act as a toggle to remove ids that were already selected
                var markForRemoval;
                // if selection already selected, mark index pos for removal
                for (var i = 0; i < this.selectedSet.length; i += 1) {
                    if (id == this.selectedSet[i]) {
                        markForRemoval = i;
                    }
                }
// if selection wasn't already selected, push on to selection list
                if (undefined === markForRemoval) {
                    this.selectedSet.push(id);
                }
// if selection list is greater than max length, mark first element for removal
                if (this.selectedSet.length > this.maxSelection) {
                    markForRemoval = 0;
                }
// if anything has been marked for removal, remove it
                if (undefined != markForRemoval) {
                    //d3.select("#key_label_" + this.selectedSet[markForRemoval]).style("font-weight", "normal");
                    //d3.select("#key_square_" + this.selectedSet[markForRemoval]).style("background", "white");
                    //d3.select("#key_count_" + this.selectedSet[markForRemoval]).text("");
                    this.selectedSet.splice(markForRemoval, 1);
                }
// set the styling for selected datasets
                for (i = 0; i < this.selectedSet.length; i += 1) {
                    //d3.select("#key_label_" + this.selectedSet[i]).style("font-weight", "bold");
                    //d3.select("#key_square_" + this.selectedSet[i]).style("background", "#99CCFF");
                    //d3.select("#key_count_" + this.selectedSet[i]).text(i + 1);
                }
                console.log(JSON.stringify(this.selectedSet));    
                setTimeout(this.makePlot(), 1);
                this.color_by_active_tags();
                
                //for some reason something gets selected !!!
                d3.selectAll(".selected").classed("selected", function (d) {
                         return 0;
                });
                    
            }
        };

        return sPlots;
    };
})(jQuery);


(function ($, undefined) {

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
        sPlots: null, //$.scatterPlots( );
        //plotArea: $('<div id="plotarea">Area for plots</div><script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>'),
        plotAreaContainer: $('<div id="plotareaContainer"></div>'),
        plotData: {
            "values": {},
            "dataSetObjs": [],
            "dataPointObjs": []
        },
        init: function (options) {
            this._super(options);

            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            return this;
        },
        loggedInCallback: function (event, auth) {
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
        loggedOutCallback: function (event, auth) {
            this.ws = null;
            this.isLoggedIn = false;
            return this;
        },
        render: function () {
            var self = this;
            self.pref = this.uuid();
            self.loading(true);

            var container = this.$elem;
            var kbws = this.ws;

            //container.append('<p>'+"2Width" + container.width());

            var barSeqExperimentResultsRef = self.buildObjectIdentity(this.options.workspaceID, this.options.barSeqExperimentResultsID, this.options.barSeqExperimentResultsVer);
            kbws.get_objects([barSeqExperimentResultsRef], function (data) {

                self.barSeqExperimentResultsData = data[0].data;
                self.genomeRef = self.barSeqExperimentResultsData.genome;

                // Job to get properties of: name and id of the annotated genome
                var jobGetBarSeqExperimentResultsProperties = kbws.get_object_subset(
                        [
                            {'ref': self.genomeRef, 'included': ['/id']},
                            {'ref': self.genomeRef, 'included': ['/scientific_name']}
                        ],
                        function (data) {
                            self.genomeID = data[0].data.id;
                            self.genomeName = data[1].data.scientific_name;
                        },
                        function (error) {
                            self.clientError(error);
                        }
                );

                //allow sorting for num with html (sType : "num-html")
                //http://datatables.net/plug-ins/sorting/num-html
                jQuery.extend(jQuery.fn.dataTableExt.oSort, {
                    "num-html-pre": function (a) {
                        var x = String(a).replace(/<[\s\S]*?>/g, "");
                        return parseFloat(x);
                    },
                    "num-html-asc": function (a, b) {
                        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
                    },
                    "num-html-desc": function (a, b) {
                        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
                    }
                });

                // Launch jobs and vizualize data once they are done
                $.when.apply($, [jobGetBarSeqExperimentResultsProperties]).done(function () {
                    self.loading(false);
                    self.prepareVizData();
                    self.prepareGenomeFeatures(kbws, self.genomeRef);

                    ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
                    container.empty();
                    var tabPane = $('<div id="' + self.pref + 'tab-content">');
                    container.append(tabPane);

                    tabPane.kbaseTabs({canDelete: true, tabs: []});
                    ///////////////////////////////////// Overview table ////////////////////////////////////////////           
                    var tabOverview = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Overview', content: tabOverview, canDelete: false, show: true});
                    var tableOver = $('<table class="table table-striped table-bordered" ' +
                            'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="' + self.pref + 'overview-table"/>');
                    tabOverview.append(tableOver);
                    tableOver
                            .append(self.makeRow(
                                    'Genome',
                                    $('<span />').append(self.genomeName).css('font-style', 'italic')))
                            .append(self.makeRow(
                                    'Genes analyzed',
                                    Object.keys(self.annotatedGenes).length))
                            .append(self.makeRow(
                                    'Number of Experiments',
                                    self.experimentsCount));

                    ///////////////////////////////////// Experiments table ////////////////////////////////////////////          
                    var tabExperiments = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Experiments', content: tabExperiments, canDelete: false, show: false});
                    var tableExperiments = $('<table class="table table-striped table-bordered" ' +
                            'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="' + self.pref + 'experiments-table"/>');
                    tabExperiments.append(tableExperiments);
                    var experimentsTableSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaData": [],
                        "aaSorting": [[1, "desc"]],
                        "aoColumns": [
                            {sTitle: "Plot", mData: "plotCheckBox", "bSortable": false},
                            {sTitle: "Description", mData: "experimentDescription"},
                            {sTitle: "Sick Genes", mData: "sickGenes", sType: "num-html"},
                            {sTitle: "Sick Genes Long", mData: "sickGenesLong", bVisible: false, bSearchable: true},
                        ],
                        "oLanguage": {
                            "sEmptyTable": "No experiments found!",
                            "sSearch": "Search: "
                        },
                        'fnDrawCallback': eventsExperimentsTab
                    };

                    var experimentsTableData = [];
                    for (var i in self.experiments) {
                        var expID = self.experiments[ i ];
                        var sickGenes = [];

                        if (typeof self.experimentToSickGenes[expID] !== 'undefined') {
                            sickGenes = self.experimentToSickGenes[expID];
                        }
                        var checkBoxPlot = '<input type = "checkbox" class = "checkbox' + self.pref + '"'
                                +
                                ' value = "' + i + '">'; //sPlot used index wihin the array

                        // Build reference to sick genes from a particular experiment
                        var genesRefs =
                                '<a class="show-genes' + self.pref + '"'
                                + ' data-expID="' + expID + '"'
                                + '>' + sickGenes.length + '</a>';

                        // add table data row            
                        experimentsTableData.push(
                                {
                                    'plotCheckBox': checkBoxPlot,
                                    'experimentDescription': self.barSeqExperimentResultsData.experiments[ i ][0].name_short, //expID, coco
                                    'sickGenes': genesRefs,
                                    'sickGenesLong': sickGenes.length
                                }
                        );
                    };
                    experimentsTableSettings.aaData = experimentsTableData;
                    tableExperiments = tableExperiments.dataTable(experimentsTableSettings);

                    ///////////////////////////////////// Experiments Tab Events ////////////////////////////////////////////          
                    function eventsExperimentsTab() {
                        $('.checkbox' + self.pref).unbind('click');
                        $('.checkbox' + self.pref).click(function () {
                            self.sPlots.set_selected_dataSet( Number($(this).attr('value')));

                            //$(this).attr('value')
                            //if($(this).is(":checked")) {
                            //    $('#plotareaContainer').append("p").text( "Chekced" + $(this).attr('value') );
                            //}else{
                            //    $('#plotareaContainer').append("p").text( "Un Chekced" + $(this).attr('value') );
                            //}
                        });


                        $('.show-genes' + self.pref).unbind('click');
                        $('.show-genes' + self.pref).click(function () {

                            var expID = $(this).attr('data-expID');

                            if (tabPane.kbaseTabs('hasTab', expID)) {
                                tabPane.kbaseTabs('showTab', expID);
                                return;
                            }

                            ////////////////////////////// Build Genes table //////////////////////////////
                            var sickGenes = [];

                            if (typeof self.experimentToSickGenes[expID] !== 'undefined') {
                                sickGenes = self.experimentToSickGenes[expID];
                            }



                            var tabContent = $("<div/>");

                            var tableGenes = $('<table class="table table-striped table-bordered" ' +
                                    'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="' + self.pref + expID + '-table"/>');
                            tabContent.append(tableGenes);
                            var geneTableSettings = {
                                "sPaginationType": "full_numbers",
                                "iDisplayLength": 10,
                                "aaData": [],
                                "aaSorting": [[0, "asc"], [1, "desc"]],
                                "aoColumns": [
                                    {sTitle: "Gene", mData: "geneID"},
                                    {sTitle: "Description", mData: "geneDescription", sWidth: "30%"},
                                ],
                                "oLanguage": {
                                    "sEmptyTable": "No genes found!",
                                    "sSearch": "Search: "
                                },
                                //'fnDrawCallback': eventsGeneTab
                            };

                            var geneTableData = [];

                            for (var geneID in sickGenes) {
                                var geneIDtoDisplay = self.genomeFeatures[ sickGenes[geneID] ].id;

                                var geneFunc = self.genomeFeatures[ sickGenes[geneID] ]['function'];
                                if (!geneFunc) {
                                    geneFunc = '-';
                                }

                                geneTableData.push({
                                    'geneID': geneIDtoDisplay,
                                    'geneDescription': geneFunc,
                                });
                            }

                            geneTableSettings.aaData = geneTableData;
                            tabPane.kbaseTabs('addTab', {tab: expID, content: tabContent, canDelete: true, show: true});
                            tableGenes.dataTable(geneTableSettings);

                        });
                        eventsMoreDescription();
                    }
                    ;


                    //////////////////// Events for Show More/less Description  ////////////////////////////////////////////       
                    function eventsMoreDescription() {
                        $('.show-more' + self.pref).unbind('click');
                        $('.show-more' + self.pref).click(function () {
                            var domainID = $(this).attr('data-id');
                            $(this).closest("td").html(self.accessionToLongDescription[domainID]);
                            eventsLessDescription();
                        });
                    }
                    function eventsLessDescription() {
                        $('.show-less' + self.pref).unbind('click');
                        $('.show-less' + self.pref).click(function () {
                            var domainID = $(this).attr('data-id');
                            $(this).closest("td").html(self.accessionToShortDescription[domainID]);
                            eventsMoreDescription();
                        });
                    }


                    //===============================================
                    //prepare area for scatter plots
                    //===============================================
                    //container.append(self.plotAreaContainer);
                    //document.getElementById('plotareaContainer').insertAdjacentHTML('beforeend', self.plotContainer);
                    //self.d3Plots();


                    //var sPlots = $.scatterPlots( );
                    //sPlots.test = 1;

                    self.sPlots = $.scatterPlots( );
                    self.sPlots.sData = self.plotData;
                    //console.log("Test0:"+self.plotData["dataPointObjs"].length);
               
                    container.append(self.sPlots.plotAreaContainer);
                    document.getElementById('plotareaContainer').insertAdjacentHTML('beforeend', self.sPlots.plotContainer);
                    self.sPlots.d3Plots(self.$elem.width());
                    $("#plotarea").empty(); //clean allocated area
                 });
            });
        },
        prepareGenomeFeatures: function (kbws, gnmref) {//self.kbws self.genomeRef 
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
                    function (data) {
                        self.genomeFeatures = data[0].data.features;
                    },
                    function (error) {
                        self.clientError(error);
                    }
            );
        },
        prepareVizData: function () {
            var self = this;


            self.experiments = [];
            self.genesToLog = [];
            self.annotatedGenes = {};

            self.experimentsCount = self.barSeqExperimentResultsData.experiments.length;

            for (var iExp = 0; iExp < self.barSeqExperimentResultsData.experiments.length; iExp++) {
                var experArray = self.barSeqExperimentResultsData.experiments[ iExp ][1];

                var minV = 999;
                var maxV = -999;

                //shorten experiment name !!!
                var t = String( self.barSeqExperimentResultsData.experiments[ iExp ][0].name ).split("|");
                if(t.length > 0) {
                    self.barSeqExperimentResultsData.experiments[ iExp ][0].name_short = String( t[ t.length-1 ] ).replace(/_/g, " ");
                }
                
                for (var i = 0; i < experArray.length; i++) {
                    
                    //typedef tuple<feature_ref f_ref,int strain_index,int count_begin,int count_end,float norm_log_ratio> bar_seq_result;

                    var geneID = experArray[i][0];
                    var logRatio = experArray[i][4];

                    self.annotatedGenes[ geneID ] = 1;

                    self.genesToLog.push(
                            {
                                'gene': "g" + geneID,
                                'logRatio': logRatio,
                                'experiment': experArray[i][0].name
                            }
                    );

                    if (!(("g" + geneID) in self.plotData["values"])) {
                        self.plotData["values"]["g" + geneID] = {};
                    }
                    self.plotData["values"]["g" + geneID][iExp] = logRatio;
                    self.plotData["values"]["g" + geneID]["dataPointName"] = "g" + geneID;
                    self.plotData["values"]["g" + geneID]["dataPointDesc"] = "g" + geneID;

                    maxV = Math.max(maxV, logRatio);
                    minV = Math.min(minV, logRatio);

                    //console.log(iExp + " " + self.barSeqExperimentResultsData.experiments[ iExp ][0]);
                    if (logRatio < -2) {
                        if (typeof self.experimentToSickGenes[
                                self.barSeqExperimentResultsData.experiments[ iExp ][0].name
                        ] === 'undefined') {
                            self.experimentToSickGenes[
                                    self.barSeqExperimentResultsData.experiments[ iExp ][0].name
                            ] = [];
                        }
                        self.experimentToSickGenes[
                                self.barSeqExperimentResultsData.experiments[ iExp ][0].name
                        ].push(geneID);
                    }
                }

                self.plotData["dataSetObjs"].push(
                        {
                            "dataSetName": self.barSeqExperimentResultsData.experiments[ iExp ][0].name_short,
                            "dataSetId": iExp,
                            "dataSetType": "Fitness",
                            "minValue": minV,
                            "maxValue": maxV
                        });

                self.experiments.push(
                        self.barSeqExperimentResultsData.experiments[ iExp ][0].name
                        );
            }

            for (var g in self.annotatedGenes) {
                self.plotData["dataPointObjs"].push(
                        {
                            "dataPointName": "g" + g, // names are unique and cannot be numbers, otherwise access ["g"] doesnot work
                            "dataPointDesc": "g" + g
                        });
            }
        },
        makeRow: function (name, value) {
            var $row = $("<tr/>")
                    .append($("<th />").css('width', '20%').append(name))
                    .append($("<td />").append(value));
            return $row;
        },
        getData: function () {
            return {
                type: 'BarSeqExperimentResults',
                id: this.options.barSeqExperimentResultsID,
                workspace: this.options.workspaceID,
                title: 'BarSeq Results'
            };
        },
        loading: function (isLoading) {
            if (isLoading)
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");
            else
                this.hideMessage();
        },
        showMessage: function (message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },
        hideMessage: function () {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },
        uuid: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
                    function (c) {
                        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
        },
        buildObjectIdentity: function (workspaceID, objectID, objectVer, wsRef) {
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
        clientError: function (error) {
            this.loading(false);
            this.showMessage(error.error.error);
        },
        plotContainer: '\
<script src="http://ajax.aspnetcdn.com/ajax/jquery/jquery-1.9.0.js"></script> \
<script src="http://ajax.aspnetcdn.com/ajax/jquery.dataTables/1.9.4/jquery.dataTables.js"></script> \
<script src="http://0.0.0.0:8080/assets/js/d3.v2.js"></script> \
<script src="http://0.0.0.0:8080/assets/js/DataScatter.js"></script> \
<script src="http://0.0.0.0:8080/assets/js/bootstrap.js"></script> \
<script src="http://0.0.0.0:8080/assets/js/bootstrapx-clickover.js"></script> \
<link type="text/css" href="http://ajax.aspnetcdn.com/ajax/jquery.dataTables/1.9.4/css/jquery.dataTables.css" rel="stylesheet">  \
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css"> \
<link href="http://0.0.0.0:8080/assets/css/bootstrap-responsive.min.css" rel="stylesheet"> \
<link href="http://0.0.0.0:8080/assets/css/identity.css" rel="stylesheet"> \
<link href="http://0.0.0.0:8080/assets/css/kbase-common.css" rel="stylesheet"> \
<link type="text/css" rel="stylesheet" href="http://0.0.0.0:8080/assets/css/DataScatter.css"> \
\
<div class="container"> \
      <div class="row"> \
        <div class="span9"> \
          <div id="plotarea"> \
          </div> \
        </div> \
        <div class="span3"> \
          <ul class="nav nav-tabs" id="myTab"> \
            <li class="active"><a href="#dataSets" data-toggle="tab">Data Sets</a></li> \
            <li><a href="#dataPointTags" data-toggle="tab">Tags</a></li> \
          </ul> \
          <div class="tab-content"> \
            <div class="tab-pane active" id="dataSets"> \
              <table id="key" class="accordian"> \
              </table> \
            </div> \
            <div class="tab-pane" id="dataPointTags"> \
              <form class="form-horizontal"> \
                <input class="span3" type="text" id="inputTag" placeholder="tag name" data-provide="typeahead" autocomplete="off" onchange="check_tag()"> \
                <textarea class="span3" rows="3" id="inputTagDataPointNames" placeholder="data point names..."></textarea> \
                <button id="addTagButton"class="btn btn-primary btn-block" type="button" onclick="addTag()">Add</button> \
                <table id="tagTable"> \
                </table> \
            </div> \
          </div> \
        </div> \
      </div> \
\
      <div class="row"> \
        <div id="dataPointsTableContainer" class="span9"> \
          <table id="dataPointsTable"> \
          </table> \
        </div> \
      </div> \
\
      <div class="row"> \
        <div class="span9"> \
          <div id="table"> \
          </div> \
        </div> \
      </div> \
\
      <div id="tooltip" style="position: absolute; z-index: 10; visibility: hidden; opacity: 0.8; background-color: rgb(34, 34, 34); color: rgb(255, 255, 255); padding: 0.5em;"> \
      </div> \
',
        d3Plots: function () {
            var self = this;

            /*
             * KBase Data Scatter Plot Widget
             * ------------------------------
             * This is designed to be an insertable widget, but is being implemented 
             * as a standalone page for now. 
             * 
             * This widget is designed to allow users to explore multiple data sets that
             * share a common set of data points. These data points are plotted in multiple
             * scatter plots, allowing the joint visualization of multiple dimensions 
             * simultaneously. 
             * 
             * This widget is based off the d3 scatterplot example by Mike Bostock. 
             * http://bl.ocks.org/mbostock/4063663
             * 
             * Paramvir Dehal
             * psdehal@lbl.gov
             * Physical Biosciences Division
             * Lawrence Berkeley National Lab
             * DOE KBase
             *
             * TODO:
             *      - Settings tab 
             *      - Marcin's Wordcloud code
             *      - Cross browser, cross platform fixes
             *      - edit tag lists, click and stay highlighted, add to tags
             *      - More user defined fields in upload tabfile "systematic name", etc
             */


            //These global variables should be in a single object structure
            var selectedSet = [];
            var maxSelection = 10;
            var hideDiagonal = 1; // toggles between showing a full square and just the upper diagonal

            //var container_dimensions = {width: 900, height: 900},
            //margins = {top: 60, right: 60, bottom: 60, left: 60},
            var container_dimensions = {width: this.$elem.width() - 120, height: this.$elem.width() - 120},
            margins = {top: 60, right: 60, bottom: 60, left: 60},
            chart_dimensions = {
                width: container_dimensions.width - margins.left - margins.right,
                height: container_dimensions.height - margins.top - margins.bottom
            };

            var padding = 25; // area between cells
            var cellAreaMargin = 16; // adds a bit to the min/max range of cell data so that data points aren't on the boarders
            var cellSize;
            var scatterplot;
            var selectedDataPoints = {};

            /*
             * Scatterplot Data object 
             * -----------------------
             * This is the central data object for this widget. It contains all the data
             * that will be plotted: dataSets, dataPoints and values. 
             *
             * Simple Example of two dataSets with two dataPoints:
             * 
             * sData = {
             *    "values": {
             *        "nameId1": {
             *            "0": 123,     // "dataSetId" : numeric value
             *            "1": -0.05,
             *            "dataPointName": "nameId1",         // names are unique
             *            "dataPointDesc": "desc of nameId1"
             *        },
             *        "nameId2": {
             *            "0": -3.3,
             *            "1": 999.05,
             *            "dataPointName": "nameId2",
             *            "dataPointDesc": "desc of nameId2"
             *        }
             *    },
             *    "dataSetObjs": [
             *        {
             *            "dataSetName": "name",      // do not have to be unique
             *            "dataSetId": 0,
             *            "dataSetType": "Fitness",
             *            "minValue": -3.3,
             *            "maxValue": 123
             *        },
             *        {
             *            "dataSetName": "name",
             *            "dataSetId": 1,
             *            "dataSetType": "Expression",
             *            "minValue": -0.05,
             *            "maxValue": 999.05
             *        }
             *    ],
             *    "dataPointObjs": [
             *        {
             *            "dataPointName": "nameId1",          // names are unique
             *            "dataPointDesc": "desc of nameId1"
             *        },
             *        {
             *            "dataPointName": "nameId2",
             *            "dataPointDesc": "desc of nameId1"
             *        }
             *    ]
             * } 
             * ----------------------------------------------
             * Still need to clean up the data object, has got a bit too much redundancy
             * 
             * "dataPointName" : must be unique, should probably auto-assign a unique
             *                   id to it instead
             * 
             * "values" : contains dataSetIds, this should be an array instead
             * 
             */
            var sData = {
                "values": {},
                "dataSetObjs": [],
                "dataPointObjs": []
            };

            sData = {
                "values": {
                    "nameId1": {
                        "0": 1, // "dataSetId" : numeric value
                        "1": 1,
                        "2": 1,
                        "dataPointName": "nameId1", // names are unique
                        "dataPointDesc": "desc of nameId1"
                    },
                    "nameId2": {
                        "0": 0,
                        "1": 0,
                        "2": 0,
                        "dataPointName": "nameId2",
                        "dataPointDesc": "desc of nameId2"
                    }
                },
                "dataSetObjs": [
                    {
                        "dataSetName": "Fitness1", // do not have to be unique
                        "dataSetId": 0,
                        "dataSetType": "Fitness",
                        "minValue": -4,
                        "maxValue": 4
                    },
                    {
                        "dataSetName": "Fitness2",
                        "dataSetId": 1,
                        "dataSetType": "Fitness",
                        "minValue": -4,
                        "maxValue": 4
                    },
                    {
                        "dataSetName": "Fitness3",
                        "dataSetId": 2,
                        "dataSetType": "Fitness",
                        "minValue": -4,
                        "maxValue": 4
                    }
                ],
                "dataPointObjs": [
                    {
                        "dataPointName": "nameId1", // names are unique
                        "dataPointDesc": "desc of nameId1"
                    },
                    {
                        "dataPointName": "nameId2",
                        "dataPointDesc": "desc of nameId2"
                    }
                ]
            };

            sData["dataPointObjs"].push(
                    {
                        "dataPointName": "x0", // names are unique and have to be non-numeric
                        "dataPointDesc": "x0"
                    });
            sData["values"]["x0"] = {
                "0": -2,
                "1": -2,
                "2": -2,
                "3": -2,
                "dataPointName": "x0",
                "dataPointDesc": "x0"
            };
            sData["values"]["nameId1"]["3"] = 1;
            sData["values"]["nameId2"]["3"] = 0;

            sData["dataSetObjs"].push(
                    {
                        "dataSetName": "Fitness4",
                        "dataSetId": 3,
                        "dataSetType": "Fitness",
                        "minValue": -4,
                        "maxValue": 4
                    });

            sData = self.plotData;

            /*
             * Tag data structure
             */

            var tags = {};
            var activeTags = [];
            var tagsByDataPointName = {}; // {"name" : [] array of tags }

            //Declare dataTables handle for the dataPointsTable to make sure it is only created once
            //otherwise dataTables freaks out
            var dataPointsTable = 0;


            // utility function to move elements to the front
            d3.selection.prototype.moveToFront = function () {
                return this.each(function () {
                    this.parentNode.appendChild(this);
                });
            };

            var tmp;


            KBScatterDraw(sData);
            load_tags();
            $("#loading").addClass("hidden");


            function KBScatterDraw(sData) {

                //reset some variables and remove everything made by the previous datafile 

                selectedSet = [];
                selectedDataPoints = {}

                $("#key").empty();
                $("#dataPointsTableContainer").empty();
                $("#plotarea").empty();


                //Drawing the key

                var key_items = d3.select("#key")
                        .selectAll("table")
                        .data(sData.dataSetObjs)
                        .enter()
                        .append("tr")
                        .attr("class", "key_exp")
                        .attr("id", function (d) {
                            return d.dataSetId
                        })
                        .on("click", function (d) {
                            $('#loading').removeClass('hidden');
                            setTimeout(function () {
                                set_selected_dataSet(d.dataSetId);
                                $('#loading').addClass('hidden');
                            }, 10);
                        });

                key_items.append("td")
                        .attr("id", function (d) {
                            return "key_count_" + d.dataSetId
                        })
                        .attr("class", function (d) {
                            return "key_count " + d.dataSetId
                        });

                key_items.append("td")
                        .attr("id", function (d) {
                            return "key_square_" + d.dataSetId
                        })
                        .attr("class", function (d) {
                            return "key_square " + d.dataSetId
                        });

                key_items.append("td")
                        .attr("id", function (d) {
                            return "key_label_" + d.dataSetId
                        })
                        .attr("class", "key_label")
                        .text(function (d) {
                            return d.dataSetName
                        });



                // Making the dataPointsTable
                $("#dataPointsTableContainer").append('<table id="dataPointsTable"></table>');
                $("#dataPointsTable").append("<thead><tr><th>Name</th><th>Description</th></tr></thead>");

                for (var i in sData.dataPointObjs) {
                    var obj = sData.dataPointObjs[i];
                    var str = "<td>" + obj.dataPointName + "</td><td>" + obj.dataPointDesc + "</td>";
                    $("#dataPointsTable").append("<tr id=" + obj.dataPointName + ">" + str + "</tr>");
                }

                dataPointsTable = $('#dataPointsTable').dataTable({"bPaginate": true,
                    "bFilter": true,
                    "asSorting": [[1, "asc"]]
                });


                setDataTablesHover();


                scatterplot = d3.select("#plotarea")
                        .append("svg")
                        .attr("width", container_dimensions.width)
                        .attr("height", container_dimensions.height)
                        .append("g")
                        .attr("transform", "translate(" + margins.left + "," + margins.top + ")")
                        .attr("id", "scatterplot");


                function makePlot(sData) {

                    d3.select("svg").remove();

                    if (hideDiagonal) {
                        numCells = selectedSet.length - 1;
                        xCells = selectedSet.slice(0, -1);
                        yCells = selectedSet.slice(1);
                    } else {
                        numCells = selectedSet.length;
                        xCells = selectedSet;
                        yCells = selectedSet;
                    }

                    cellSize = chart_dimensions.width / numCells;
                    scatterplot = d3.select("#plotarea")
                            .append("svg")
                            .attr("width", container_dimensions.width)
                            .attr("height", container_dimensions.height)
                            .append("g")
                            .attr("transform", "translate(" + margins.left + "," + margins.top + ")")
                            .attr("id", "scatterplot");

                    var x_axis_scale = {},
                            y_axis_scale = {};

                    selectedSet.forEach(function (dataSet) {
                        //going to add a bit of padding to the min and max value
                        var min = sData.dataSetObjs[dataSet].minValue - (((cellSize + cellAreaMargin) / cellSize - 1) * (sData.dataSetObjs[dataSet].maxValue - sData.dataSetObjs[dataSet].minValue)) / 2;
                        var max = parseFloat(sData.dataSetObjs[dataSet].maxValue) + parseFloat((((cellSize + cellAreaMargin) / cellSize - 1) * (sData.dataSetObjs[dataSet].maxValue - sData.dataSetObjs[dataSet].minValue)) / 2);

                        x_axis_scale[dataSet] = d3.scale.linear()
                                .domain([min, max])
                                .range([padding / 2, cellSize - padding / 2]);

                        y_axis_scale[dataSet] = d3.scale.linear()
                                .domain([min, max])
                                .range([cellSize - padding / 2, padding / 2]);
                    });


                    var axis = d3.svg.axis();
                    //.ticks(5)
                    //.tickSize( chart_dimensions.width );


                    scatterplot.selectAll("g.x.axis")
                            .data(xCells)
                            .enter().append("g")
                            .attr("class", "x axis")
                            .attr("transform", function (d, i) {
                                return "translate(" + i * cellSize + "," + "0" + ")";
                            })
                            .each(function (d) {
                                d3.select(this).call(axis.scale(x_axis_scale[d]).orient("top"));
                            });

                    scatterplot.selectAll("g.y.axis")
                            .data(yCells)
                            .enter().append("g")
                            .attr("class", "y axis")
                            .attr("transform", function (d, i) {
                                return "translate(0," + (yCells.length - 1 - i) * cellSize + ")";
                            })
                            .each(function (d) {
                                d3.select(this).call(axis.scale(y_axis_scale[d]).orient("left"));
                            });

                    var brush = d3.svg.brush()
                            .on("brushstart", brushstart)
                            .on("brush", brush)
                            .on("brushend", brushend);

                    var cell = scatterplot.selectAll("g.cell")
                            .data(cross(selectedSet, selectedSet))
                            .enter()
                            .append("g")
                            .attr("class", "cell")
                            .attr("transform", function (d) {
                                return "translate(" + d.i * cellSize + "," + (selectedSet.length - 1 - d.j) * cellSize + ")";
                            })
                            .each(plotCell);

                    // Titles for the diagonal.
                    /*cell.filter(function(d) { return d.i == d.j-1; })
                     .append("text")
                     .attr("x", cellSize/2)
                     .attr("y", cellSize)
                     .attr("dy", ".71em")
                     .attr("text-anchor", "middle")
                     .text(function(d) { return sData.dataSetObjs[d.x].dataSetName; });
                     
                     cell.filter(function(d) { return d.i == d.j-1; })
                     .append("text")
                     //.attr("x", cellSize)
                     //.attr("y", cellSize/2)
                     .attr("text-anchor", "middle")
                     .attr("dy", ".71em")
                     .attr("transform", "translate(" + cellSize + "," + cellSize/2 + ") rotate(-90)")
                     .text(function(d) { return sData.dataSetObjs[d.y].dataSetName; });
                     */

                    cell.append("text")
                            .attr("x", cellSize / 2)
                            .attr("y", cellSize)
                            .attr("text-anchor", "middle")
                            .text(function (d) {
                                return sData.dataSetObjs[d.x].dataSetName;
                            });

                    cell.append("text")
                            .attr("text-anchor", "middle")
                            .attr("transform", "translate(" + cellSize + "," + cellSize / 2 + ") rotate(-90)")
                            .text(function (d) {
                                return sData.dataSetObjs[d.y].dataSetName;
                            });

                    function plotCell(cellData) {
                        var cell = d3.select(this);

                        cell.append("rect")
                                .attr("class", "frame")
                                .attr("x", padding / 2)
                                .attr("y", padding / 2)
                                .attr("width", cellSize - padding)
                                .attr("height", cellSize - padding);

                        cell.call(brush.x(x_axis_scale[cellData.x]).y(y_axis_scale[cellData.y]));

                        // Have to put circles in last so that they 
                        // are in the front for the mouseover to work

                        cell.selectAll("circle")
                                .data(sData.dataPointObjs)
                                .enter()
                                .append("circle")
                                .attr("id", function (d) {
                                    return d.dataPointName;
                                })
                                .attr("cx", function (d) {
                                    return x_axis_scale[cellData.x](sData.values[d.dataPointName][cellData.x]);
                                })
                                .attr("cy", function (d) {
                                    return y_axis_scale[cellData.y](sData.values[d.dataPointName][cellData.y]);
                                })
                                .attr("r", 4)
                                .on("mouseover", function (d) {
                                    var id = $(this).attr("id");
                                    var tagStr = "";

                                    d3.selectAll("circle#" + id).classed("highlighted", 1)
                                            .attr("r", 6)
                                            .moveToFront();

                                    d3.selectAll("tr#" + id).style("background", "orange");

                                    if (tagsByDataPointName[id] != undefined) {
                                        tagStr = "<br>Tags: " + tagsByDataPointName[id].join(", ");
                                    }
                                    $('#tooltip').html(id + ": " + d.dataPointDesc + tagStr);
                                    return $('#tooltip').css("visibility", "visible");
                                })
                                .on("mousemove", function () {
                                    //does not work properly on KBase: 
                                    return $('#tooltip').css("top", (d3.event.pageY + 15) + "px").css("left", (d3.event.pageX - 10) + "px");
                                    //var matrix = this.getScreenCTM()
                                    //        .translate(+this.getAttribute("cx"), +this.getAttribute("cy"));
                                    //return $('#tooltip').css("top", (window.pageXOffset + matrix.e + 15) + "px").css("left", (window.pageYOffset + matrix.f - 10) + "px");
                                    //return $('#tooltip').css("top", (this.getAttribute("cx") + 15) + "px").css("left", (this.getAttribute("cy") - 10) + "px");
                                })
                                .on("mouseout", function (d) {
                                    var id = $(this).attr("id");

                                    d3.selectAll("circle#" + id).classed("highlighted", 0)
                                            .attr("r", 4);

                                    d3.selectAll("tr#" + id).style("background", "");

                                    return $('#tooltip').css("visibility", "hidden");
                                });

                    }


                    function brushstart(p) {
                        if (brush.data !== p) {
                            cell.call(brush.clear());
                            brush.x(x_axis_scale[p.x]).y(y_axis_scale[p.y]).data = p;
                        }
                    }

                    function brush(p) {
                        var e = brush.extent(); //2d array of x,y coords for select rectangle

                        //can get a speed up by just selecting the circles from the cell
                        scatterplot.selectAll("circle").classed("selected", function (d) {
                            if (e[0][0] <= sData.values[d.dataPointName][p.x] && sData.values[d.dataPointName][p.x] <= e[1][0]
                                    && e[0][1] <= sData.values[d.dataPointName][p.y] && sData.values[d.dataPointName][p.y] <= e[1][1]) {

                                return 1;
                            }
                            else {
                                return 0;
                            }

                        });
                    }

                    function brushend() {
                        var tableData = [];
                        var uniquePoints = [];
                        var points = [];
                        var nTrArray = [];

                        if (brush.empty()) {
                            scatterplot.selectAll("circle").classed("selected", 0);
                            dataPointsTable.fnClearTable();
                            for (var d in sData.dataPointObjs) {
                                var tmp = [sData.dataPointObjs[d].dataPointName, sData.dataPointObjs[d].dataPointDesc];
                                tableData.push(tmp);
                            }
                            nTrArray = dataPointsTable.fnAddData(tableData);
                            for (var i in nTrArray) {
                                dataPointsTable.fnSettings().aoData[ i ].nTr.id = sData.dataPointObjs[i].dataPointName;
                            }
                            setDataTablesHover();

                        }
                        else {

                            d3.selectAll(".selected").classed("selected", function (d) {
                                points[d.dataPointName] = d.dataPointName;
                                return 1;
                            }).moveToFront();

                            for (var i in points) {
                                uniquePoints.push(points[i]);
                            }

                            dataPointsTable.fnClearTable();
                            for (var d in uniquePoints) {
                                var tmp = [uniquePoints[d], sData.values[ uniquePoints[d] ].dataPointDesc];
                                tableData.push(tmp);
                            }

                            nTrArray = dataPointsTable.fnAddData(tableData);

                            for (var i in nTrArray) {
                                dataPointsTable.fnSettings().aoData[ i ].nTr.id = uniquePoints[i];
                            }
                            setDataTablesHover();
                        }

                    }
                }
                
                function setDataTablesHover() {
                    $(dataPointsTable.fnGetNodes()).hover(
                            function () {
                                $(this).css("background", "orange");
                                var id = $(this).attr("id");
                                d3.selectAll("circle#" + id).classed("highlighted", 1)
                                        .attr("r", 6)
                                        .moveToFront();
                            },
                            function () {
                                $(this).css("background", "");
                                var id = $(this).attr("id");
                                d3.selectAll("circle#" + id).classed("highlighted", 0)
                                        .attr("r", 4);
                            }
                    );
                }


                function set_selected_dataSet(id) {

                    // flag for dataSets to act as a toggle to remove ids that were already selected
                    var markForRemoval;


                    // if selection already selected, mark index pos for removal
                    for (var i = 0; i < selectedSet.length; i += 1) {
                        if (id == selectedSet[i]) {
                            markForRemoval = i;
                        }
                    }
                    // if selection wasn't already selected, push on to selection list
                    if (undefined === markForRemoval) {
                        selectedSet.push(id);
                    }
                    // if selection list is greater than max length, mark first element for removal
                    if (selectedSet.length > maxSelection) {
                        markForRemoval = 0;
                    }
                    // if anything has been marked for removal, remove it
                    if (undefined != markForRemoval) {
                        d3.select("#key_label_" + selectedSet[markForRemoval]).style("font-weight", "normal");
                        d3.select("#key_square_" + selectedSet[markForRemoval]).style("background", "white");
                        d3.select("#key_count_" + selectedSet[markForRemoval]).text("");
                        selectedSet.splice(markForRemoval, 1);
                    }
                    // set the styling for selected datasets
                    for (i = 0; i < selectedSet.length; i += 1) {
                        d3.select("#key_label_" + selectedSet[i]).style("font-weight", "bold");
                        d3.select("#key_square_" + selectedSet[i]).style("background", "#99CCFF");
                        d3.select("#key_count_" + selectedSet[i]).text(i + 1);
                    }

                    setTimeout(makePlot(sData), 1);
                    color_by_active_tags();

                }
            }


            /*
             * check_tag()
             * ----------
             * check the input tag to see if it already exists, if so
             * enter the dataPointNames associated with the tag into the
             * #inputTagDataPointNames textbox and change the value of
             * #addTagButton to "Replace"
             *
             */

            function check_tag() {
                var tagName = $('#inputTag').val();
                var tagExists = false;

                for (var i in tags) {
                    if (i === tagName) {
                        tagExists = true;
                    }
                }

                if (tagExists) {
                    $('#inputTagDataPointNames').val(tags[i]['dataPointNames'].join("\n"));
                    $('#addTagButton').html("Replace");
                } else {
                    $('#addTagButton').html("Add");
                }
            }

            /*
             * addTag()
             * --------
             * processes form input for adding a tag and updates the tag list table
             *
             */

            function addTag() {
                var tagName = $('#inputTag').val();
                var taggedDataPointNames = $('#inputTagDataPointNames').val().split(/[, ]|\r\n|\n|\r/g);

                //Need to add really user data entry checking
                if ($('#inputTagDataPointNames').val() === "" || taggedDataPointNames.length === 0) {
                    return;
                }
                var validDataPointNames = [];
                var count = 0;
                for (var i = 0; i < taggedDataPointNames.length; i++) {
                    if (sData.values[ taggedDataPointNames[i] ] != undefined) {
                        if (true) {
                            validDataPointNames.push(taggedDataPointNames[i]);
                        }
                    } else {
                        console.log("undefined: [" + taggedDataPointNames[i] + "]");
                        count++;
                    }
                }
                console.log("Tag: " + tagName + " Num: " + taggedDataPointNames.length + " failed: " + count);
                var tagExists = false;
                var tagActive = false;
                var color = "";

                for (var i in tags) {
                    if (i === tagName) {
                        tagExists = true;
                        for (var j = 0; j < activeTags.length; j++) {
                            if (activeTags[j]["id"] === tagName) {
                                tagActive = true;
                                color = activeTags[j]["color"];
                                unset_tag_color(tagName);
                            }
                        }
                    }
                }



                tags[tagName] = {"status": 0,
                    "dataPointNames": []
                };


                for (var i = 0; i < validDataPointNames.length; i++) {
                    tags[ tagName ]["dataPointNames"].push(validDataPointNames[i]);
                    if (tagsByDataPointName[validDataPointNames[i]] == undefined) {
                        tagsByDataPointName[validDataPointNames[i]] = [];
                    }
                    tagsByDataPointName[validDataPointNames[i]].push(tagName);
                }

                /*
                 * if tag exists, 
                 * call color_by_active tags if replaced tag is active
                 * return without redrawing the table entry
                 */
                if (tagExists) {
                    if (tagActive) {
                        set_tag_color(color, tagName);
                    }
                    return;
                }


                var tagTable = $('#tagTable')
                        .append("<tr class='tag_exp' id='" + tagName + "'>" +
                                "<td class='tag_order' id='tag_order_" + tagName + "'></td>" +
                                "<td id='colorSelect_" + tagName + "' class='tag_square'></td>" +
                                "<td class='key_label' id='key_label_" + tagName + "'>" + tagName +
                                "</td>" +
                                "</tr>");
                //
                var colorTable = "<table id='colorSelect'>" +
                        "<tr>" +
                        "<td style='background-color:#1f77b4'></td>" +
                        "<td style='background-color:#99ccff'></td>" +
                        "<td style='background-color:#ff7f0e'></td>" +
                        "<td style='background-color:#ffbb78'></td>" +
                        "</tr><tr>" +
                        "<td style='background-color:#2ca02c'></td>" +
                        "<td style='background-color:#98df8a'></td>" +
                        "<td style='background-color:#d62728'></td>" +
                        "<td style='background-color:#ff9896'></td>" +
                        "</tr><tr>" +
                        "<td style='background-color:#9467bd'></td>" +
                        "<td style='background-color:#c5b0d5'></td>" +
                        "<td style='background-color:#8c564b'></td>" +
                        "<td style='background-color:#c49c94'></td>" +
                        "</tr><tr>" +
                        "<td style='background-color:#e377c2'></td>" +
                        "<td style='background-color:#f7b6d2'></td>" +
                        "<td style='background-color:#7f7f7f'></td>" +
                        "<td style='background-color:#c7c7c7'></td>" +
                        "</tr><tr>" +
                        "<td id='colorNone' colspan=4><button class='btn btn-mini btn-block' type='button'>None</button></td>" +
                        "</tr>"
                "</table>";


                tmp = $('<div>' + colorTable + '</div>');

                tmp.find('td')
                        .attr('onclick', "set_tag_color($(this).css('background-color'), '" + tagName + "')");

                tmp.find("#colorNone")
                        .attr('onclick', 'unset_tag_color("' + tagName + '")');

                $('#colorSelect_' + tagName).clickover({
                    html: true,
                    placement: "bottom",
                    title: 'tag color<button type="button" class="close" data-dismiss="clickover">&times;</button>',
                    trigger: 'manual',
                    width: '160px',
                    content: tmp.html()
                });

            }

            /*
             * set_tag_color(tagColor, id)
             * ----------------------
             * takes input color 
             * and applies it to the dataPoints with the "tag" (id)
             *
             * tagColor : color you want all the dataPoints with "tag" to be colored
             * id : id of the tag
             * 
             * 
             * returns nothing
             */

            function set_tag_color(tagColor, id) {

                $('#tag_' + id).remove();
                $("<style type='text/css' id='tag_" + id + "'>.tag_" + id + "{ fill: " + tagColor + "; fill-opacity: .7; }</style>").appendTo("head");

                $('#colorSelect_' + id).css("background-color", tagColor);

                for (var i = 0; i < tags[id]["dataPointNames"].length; i++) {
                    d3.selectAll("circle#" + tags[id]["dataPointNames"][i])
                            .classed("tag_" + id, 1)
                            .moveToFront();
                }

                for (var i = 0; i < activeTags.length; i++) {
                    if (activeTags[i]["id"] === id) {
                        activeTags.splice(i, 1);
                    }
                }
                activeTags.push({"id": id, "color": tagColor});
                $('#tag_order_' + id).html(activeTags.length);

                update_tag_order();

            }

            /*
             * unset_tag_color(id)
             * -------------------
             * takes input tag and unapplies the tag color to all dataPoints with that tag
             * note: coloring by other tags will still apply
             */

            function unset_tag_color(id) {
                $('#tag_' + id).remove(); //removes existing css styling from dom

                $('#colorSelect_' + id).css("background-color", "");

                for (var i = 0; i < tags[id]["dataPointNames"].length; i++) {
                    d3.selectAll("circle#" + tags[id]["dataPointNames"][i])
                            .classed("tag_" + id, 0);
                }
                for (var i = 0; i < activeTags.length; i++) {
                    if (activeTags[i]["id"] === id) {
                        activeTags.splice(i, 1);
                    }
                }

                $('#tag_order_' + id).html('');
                update_tag_order();
            }

            /*
             * update_tag_order()
             * ------------------
             * updates the html doc to show the tag selection order
             *
             * returns nothing
             */

            function update_tag_order() {
                for (var i = 0; i < activeTags.length; i++) {
                    $('#tag_order_' + activeTags[i]["id"]).html(i + 1);
                }
            }
            
            /*
             * color_by_active_tags() 
             * ----------------------
             * re-colors all dataPoints using the active tags in activeTags object
             *
             * returns nothing
             */

            function color_by_active_tags() {
                for (var i = 0; i < activeTags.length; i++) {

                    var id = activeTags[i]["id"];
                    var color = activeTags[i]["color"];

                    $('#tag_' + id).remove();
                    $("<style type='text/css' id='tag_" + id + "'>.tag_" +
                            id + "{ fill: " +
                            color + "; fill-opacity: .7; }</style>")
                            .appendTo("head");

                    for (var t = 0; t < tags[id]["dataPointNames"].length; t++) {
                        d3.selectAll("circle#" + tags[id]["dataPointNames"][t])
                                .classed("tag_" + id, 1)
                                .moveToFront();
                    }
                }
            }

            function load_tags() {
                var tmpTags = {
                    "General_Secretion": "SO_0165\nSO_0166\nSO_0167\nSO_0168\nSO_0169\nSO_0170\nSO_0172\nSO_0173\nSO_0175\nSO_0176",
                    "Megaplasmid": "SO_A0001"
                };

                var source = [];
                for (var i in tmpTags) {
                    $('#inputTag').val(i);
                    $('#inputTagDataPointNames').val(tmpTags[i]);
                    addTag();
                    source.push(i);
                }

                $('#inputTag').typeahead({
                    source: source
                });
            }


        }


    });
})(jQuery);
