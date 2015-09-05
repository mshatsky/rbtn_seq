/**
 * Widget to vizualize BarSeqExperimentResults object.
 * Max Shatsky <mshatsky@lbl.gov>, John-Marc Chandonia <jmchandonia@lbl.gov>
 * @public
 */



(function ($) {
    
/*
 * KBase Data Scatter Plot Widget
 * ------------------------------
 * This is designed to be an insertable widget.
 * 
 * This widget is designed to allow users to explore multiple data sets that
 * share a common set of data points. These data points are plotted in multiple
 * scatter plots, allowing the joint visualization of multiple dimensions 
 * simultaneously. 
 * 
 * This widget is first started as a spin off the d3 scatterplot example by Mike Bostock. 
 * http://bl.ocks.org/mbostock/4063663
 * then adopted by Paramvir Dehal and turned to support multiple scatterplots 
 * and finally revised by Max Shatsky to be a standalone widget within KBase.
 * 
 * relevant interface functions:
 * 
 //------init--------------
 //
 self.sPlots = $.scatterPlots( uuid );
 //set data
 self.sPlots.setDataFrom2Dmatrix(self.barSeqExperimentResultsData.features_by_experiments, point2desc);
 //add a call-back function when points are selected with a mouse
 self.sPlots.addBrushEventSelectCallback(
                            function(points){ 
                                console.log("Event points triggered: " + points.length); 
                            });
//add scatter plots html elements to the current div
container.append(self.sPlots.plotAreaContainer);
document.getElementById(self.pref+'plotareaContainer').insertAdjacentHTML('beforeend', self.sPlots.plotHeader);
//init scatterplot graphics
self.sPlots.initGraphics(self.$elem.width());
//add tag to color selected points
self.sPlots.addTag("globalSelection", "#ff4d00");
//------end of init----------


//Usage:

//add/remove specific data set to/from the plots
self.sPlots.set_selected_dataSet( set_id );

//add a point to 'globalSelection' tag (make it colored)
self.sPlots.addPointToTag("globalSelection", point_id);
 */

    
    $.scatterPlots = function (pref) {
        var sPlots = {
            pref: pref, /* unique identifier to distinguish the multiple instances */
            
 /*
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
 */
            sData: {
                "values": {},
                "dataSetObjs": [],
                "dataPointObjs": []
            },
            
            
            /*
             * Build sData object from:
             * 
             * Input: 
             * 
             * 1) mat2D object of the form
             * KBaseFeatureValues.FloatMatrix2D
             * 
             * typedef structure {
             *  list<string> row_ids;
             *  list<string> col_ids;
             *  list<list<float>> values;
             * } FloatMatrix2D;
             * 
             * 2) pname2desc (optional) mapping of point names (in mat2D.row_ids) to 
             * a user specified more detailed description 
             */
            setDataFrom2Dmatrix: function (mat2D, pname2desc) {
                var self = this;

                //iterate over experiments
                for(var iCol = 0; iCol < mat2D.col_ids.length; ++iCol){
                    var minV = 999;
                    var maxV = -999;

                    //iterate over datapoints
                    for(var iRow = 0; iRow < mat2D.row_ids.length; ++iRow){
                        var pointName = mat2D.row_ids[ iRow ];
                    
                        if (!(pointName in self.sData["values"])) {
                            self.sData["values"][pointName] = {};
                        }
                        self.sData["values"][pointName][iCol] = mat2D.values[iRow][iCol];
                        self.sData["values"][pointName]["dataPointName"] = pointName;
                        self.sData["values"][pointName]["dataPointDesc"] = pointName;

                        maxV = Math.max(maxV, mat2D.values[iRow][iCol]);
                        minV = Math.min(minV, mat2D.values[iRow][iCol]);
                    }
                
                
                    self.sData["dataSetObjs"].push(
                        {
                            "dataSetName": mat2D.col_ids[ iCol],
                            "dataSetId": iCol,
                            "dataSetType": "Fitness",
                            "minValue": minV,
                            "maxValue": maxV
                        });

                }
            
                
                //iterate over datapoints
                for (var iRow = 0; iRow < mat2D.row_ids.length; ++iRow) {
                    var pointName = mat2D.row_ids[ iRow ];
                    var descr = "";

                    //console.log(pname2desc[pointName]);
                    
                    if(pname2desc !== undefined && pointName in pname2desc){
                            descr = pname2desc[pointName];
                    }
                    
                    self.sData["dataPointObjs"].push(
                            {
                                "dataPointName": pointName, // names are unique and cannot be numbers, otherwise access ["g"] doesnot work
                                "dataPointDesc": descr
                            });
                }   
            },
            
            //adds a callback function to be activated upon brush select event
            addBrushEventSelectCallback: function (fcallback){
              this.brushEventSelectCallback.push(fcallback);  
            },
            
              
            //array of user added functions to call upon brush selection event, it will pass an array of selected ids
            brushEventSelectCallback: [], 
            
            //a subset of experiments to display
            selectedSet: [],
            //limit on number of plots to display
            maxSelection: 10,
            //toggles between showing a full square and just the upper diagonal
            hideDiagonal: 0, 
            
            //plot related dimensions/margins etc.
            container_dimensions: {}, 
            margins: {},
            chart_dimensions: {},
            padding: 25, // area between cells
            cellAreaMargin: 16, // adds a bit to the min/max range of cell data so that data points aren't on the boarders

            /*
             * Tag data structure
             * allows to create various tags for diff coloring of points
             * at this moment only single tag is used 'active' to color
             * selected points
             */
            tags: {},
            activeTags: [],
            tagsByDataPointName: {}, // {"name" : [] array of tags }

            plotAreaContainer: $('<div id="'+ pref + 'plotareaContainer"></div>'),
            plotHeader: '\
<style type="text/css"> \
/* box created by a cursor (brush.extent()) that selects points within a cell */ \
rect.extent { \
        fill: #000; \
        fill-opacity: .125; \
        stroke: #fff; \
} \
/* frame of a cell (plot) */ \
rect.frame { \
        fill:#fff; \
        stroke: #aaa; \
} \
#plotarea { \
        float: left; \
} \
.axis { \
    shape-rendering: crispEdges; \
} \
.axis line { \
        stroke: #ddd; \
        stroke-width: .5px; \
} \
.axis path { \
        display: none; \
} \
circle { \
        fill: #99CCFF; \
        fill-opacity: .75; \
        stroke: none; \
} \
.spselected { \
        fill-opacity: .5; \
        stroke: #800; \
        stroke-width: 2; \
} \
.highlighted { \
        fill-opacity: .75; \
        stroke: orange; \
        stroke-width: 2; \
} \
.cell text { \
        pointer-events: none; \
} \
</style> \
<div class="span9"> \
          <div id="plotarea"> \
          </div> \
      </div> \
      <div id="tooltip" style="position: absolute; z-index: 10; visibility: hidden; opacity: 0.8; background-color: rgb(34, 34, 34); color: rgb(255, 255, 255); padding: 0.5em;"> \
      </div> \
',
     
            initGraphics: function (widthX) {
          
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

    
                var scatterplot = d3.select('#'+this.pref+'plotareaContainer').select("#plotarea")
                        .append("svg")
                        .attr("width", this.container_dimensions.width)
                        .attr("height", this.container_dimensions.height)
                        .append("g")
                        .attr("transform", "translate(" + this.margins.left + "," + this.margins.top + ")")
                        .attr("id", "scatterplot");
                
                $('#'+this.pref+'plotareaContainer').find("#plotarea").empty();

                //load_tags(); !!!
                //$("#loading").addClass("hidden");
                
                //init global gene selection tag
                //var tagName = "globalSelection";
                //this.tags[tagName] = {};
                //this.tags[tagName] = {
                //    "status": 0,
                //    "dataPointNames": []
                //};
                //var color = "#ff4d00";
                //this.activeTags.push({"id": tagName, "color": color});
            },
            
            //add tag name to color points
            addTag: function(tagName, color){
                this.tags[tagName] = {};
                this.tags[tagName] = {
                    "status": 0,
                    "dataPointNames": []
                };
                this.activeTags.push({"id": tagName, "color": color});
            },
            
            //add point to a tag (for coloring)
            addPointToTag: function (tagName, pointId){
                if (undefined === this.tags[tagName]) {
                    console.log("Error: tag name undefined: " + tagName);
                    return;
                }
             
                var newPoints = [];
                var iFound = -1;
                //check if it is already there, if yes, delete
                for(var i in this.tags[tagName]["dataPointNames"]){
                    if(this.tags[tagName]["dataPointNames"][i] === pointId){
                        iFound = i;
                    }else{
                        newPoints.push( this.tags[tagName]["dataPointNames"][i] );
                    }
                }
                
                if(iFound == -1){
                    newPoints.push(pointId); //add point
                }else{
                    //remove color when point is disselected
                    d3.select('#'+this.pref+'plotareaContainer').selectAll("circle#" + this.tags[tagName]["dataPointNames"][iFound])
                            .classed("tag_" + tagName, 0);
                   
                }
                
                this.tags[tagName]["dataPointNames"] = newPoints;  
                this.color_by_active_tags();
                console.log("addPointToTag: "+pointId+" : "+iFound+" : "+JSON.stringify(this.tags[tagName]));
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
                    console.log("TagAct: " + this.activeTags[i]["id"]);
                    
                    var id = this.activeTags[i]["id"];
                    var color = this.activeTags[i]["color"];

                    $('#tag_' + id).remove();
                    $("<style type='text/css' id='tag_" + id + "'>.tag_" +
                            id + "{ fill: " +
                            color + "; fill-opacity: .7; }</style>")
                            .appendTo("head");

                    for (var t = 0; t < this.tags[id]["dataPointNames"].length; t++) {
                        console.log("TagAct Color Points: " + id + " : " + this.tags[id]["dataPointNames"][t]);
                    
                        d3.select('#'+this.pref+'plotareaContainer').selectAll("circle#" + this.tags[id]["dataPointNames"][t])
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
                var self = this;

                d3.select('#'+self.pref+'plotareaContainer').select("svg").remove();
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
                scatterplot = d3.select('#'+self.pref+'plotareaContainer').select("#plotarea")
                        .append("svg")
                        .attr("width", self.container_dimensions.width)
                        .attr("height", self.container_dimensions.height)
                        .append("g")
                        .attr("transform", "translate(" + self.margins.left + "," + self.margins.top + ")")
                        .attr("id", "scatterplot");
                var x_axis_scale = {},
                    y_axis_scale = {};

                for (var i = 0; i < self.selectedSet.length; i++) {
                    var dataSet = self.selectedSet[i];

                    //going to add a bit of this.padding to the min and max value
                    var min = self.sData.dataSetObjs[dataSet].minValue - (((cellSize + self.cellAreaMargin) / cellSize - 1) * (self.sData.dataSetObjs[dataSet].maxValue - self.sData.dataSetObjs[dataSet].minValue)) / 2;
                    var max = parseFloat(self.sData.dataSetObjs[dataSet].maxValue) + parseFloat((((cellSize + self.cellAreaMargin) / cellSize - 1) * (self.sData.dataSetObjs[dataSet].maxValue - self.sData.dataSetObjs[dataSet].minValue)) / 2);
                    x_axis_scale[dataSet] = d3.scale.linear()
                            .domain([min, max])
                            .range([self.padding / 2, cellSize - self.padding / 2]);
                    y_axis_scale[dataSet] = d3.scale.linear()
                            .domain([min, max])
                            .range([cellSize - self.padding / 2, self.padding / 2]);
                }
                ;
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

                var circles = scatterplot.selectAll("circle");
                
                function brushstart(p) {
                    if (brush.data !== p) {
                        cell.call(brush.clear());
                        brush.x(x_axis_scale[p.x]).y(y_axis_scale[p.y]).data = p;
                    }
                }

                function brush(p) {
                    var e = brush.extent(); //2d array of x,y coords for select rectangle

                    //can get a speed up by just selecting the circles from the cell
                    //scatterplot.selectAll("circle").classed("spselected", function (d) {
                    circles.classed("spselected", function (d) {
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
                    var uniquePoints = [];
                    var points = [];
                    var nTrArray = [];
                    if (brush.empty()) {
                        //scatterplot.selectAll("circle").classed("spselected", 0);                        
                        circles.classed("spselected", 0);                        
                    }
                    else {
                        scatterplot.selectAll(".spselected").classed("spselected", function (d) {
                            points[d.dataPointName] = d.dataPointName;
                            return 1;
                        }).moveToFront();
                        
                        console.log("Brush end obj: "+self.pref);
                        console.log(JSON.stringify(points));
                        
                        for (var i in points) {
                            uniquePoints.push(points[i]);
                        }
                        console.log(JSON.stringify(uniquePoints));
                        
                        //callback client functions that were registered to receive selected points
                        for(var f in self.brushEventSelectCallback){
                            self.brushEventSelectCallback[ f ](uniquePoints);
                        }
                    }

                }
            
                function plotCell(cellData) {
                    var cell = d3.select(this);
                    console.log("Plotcell: "+JSON.stringify(cell));
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
                            .attr("tooltiptext", function (d) {
                                return d.tooltiptext;
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
                                d3.select('#'+self.pref+'plotareaContainer').selectAll("circle#" + id).classed("highlighted", 1)
                                        .attr("r", 6)
                                        .moveToFront();
                                d3.select('#'+self.pref+'plotareaContainer').selectAll("tr#" + id).style("background", "orange");
                                if (self.tagsByDataPointName[id] != undefined) {
                                    tagStr = "<br>Tags: " + self.tagsByDataPointName[id].join(", ");
                                }
                                $('#tooltip').html(id + ": " + d.dataPointDesc + tagStr);
                                return $('#tooltip').css("visibility", "visible");
                            })
                            .on("mousemove", function () {
                                var p = $('#notebook').offset(); //relies on KBase notebook offset. Tried to avoid it but could not find a way.
                                return $('#tooltip').css("top", (d3.event.pageY - p.top + 15) + "px").css("left", (d3.event.pageX - p.left - 10) + "px");
                                })
                            .on("mouseout", function (d) {
                                var id = $(this).attr("id");
                                d3.select('#'+self.pref+'plotareaContainer').selectAll("circle#" + id).classed("highlighted", 0)
                                        .attr("r", 4);
                                d3.select('#'+self.pref+'plotareaContainer').selectAll("tr#" + id).style("background", "");
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
                
                console.log("TagAdded Active2: " + this.activeTags[0]["id"]);
                console.log("TagAdded2: " + Object.keys(this.tags).length);
            
                setTimeout(this.makePlot(), 1);
                this.color_by_active_tags();

            
                //for some reason something gets selected !!!
                //select('#'+this.pref+'plotareaContainer')
                //change .selected to some other name
                d3.select('#'+this.pref+'plotareaContainer').selectAll(".spselected").classed("spselected", function (d) {
                    return 0;
                });
                
                console.log("TagAdded Active3: " + this.activeTags[0]["id"]);
                console.log("TagAdded3: " + Object.keys(this.tags).length);
            
                console.log("set_selected_dataSet length: "+this.selectedSet.length);
                    
                //clean plot if nothing to show
                if(this.selectedSet.length < 1){
                    $('#'+this.pref+'plotareaContainer').find("#plotarea").empty();
                }
            },
                   
            //utility function to compute offset of an alement 
            offset: function () {
                var ele = $("#plotarea");//this[0];

                if (ele && ele.isNode()) {
                    var offset = {
                        x: ele._private.position.x,
                        y: ele._private.position.y
                    };

                    var parents = ele.parents();
                    for (var i = 0; i < parents.length; i++) {
                        var parent = parents[i];
                        var parentPos = parent._private.position;

                        offset.x += parentPos.x;
                        offset.y += parentPos.y;
                    }

                    return offset;
                }
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
        geneID2index: {},
        geneCart: {}, //gene cart with selected genes (gene names)
        genesBoxed: {}, //selected genes with a brush from sPlots
        sPlots: null, //$.scatterPlots( );
        //plotArea: $('<div id="plotarea">Area for plots</div><script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>'),
        //plotAreaContainer: $('<div id="plotareaContainer"></div>'),
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
            self.pref = "pc"+this.uuid() + "-";
            self.loading(true);

            //console.log("Length of experiments :" + self.experiments.length);
            //console.log("UUID :" + self.pref);
            //console.log("experimentsCount " + self.experimentsCount);
            //console.log("Sick genes : " + Object.keys(self.experimentToSickGenes));
            
            var container = this.$elem;
            var kbws = this.ws;

            //container.append('<p>'+"2Width" + container.width());

            var barSeqExperimentResultsRef = self.buildObjectIdentity(this.options.workspaceID, this.options.barSeqExperimentResultsID, this.options.barSeqExperimentResultsVer);
            
            kbws.get_objects([barSeqExperimentResultsRef], function (data) {

                self.barSeqExperimentResultsData = data[0].data;
                self.genomeRef = self.barSeqExperimentResultsData.genome;

                // Job to get properties of: name and id of the annotated genome
                var jobGetBarSeqExperimentResultsProperties = kbws.get_object_subset( //runs in background
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

                var jobGetGenomeFeatures = kbws.get_object_subset( //runs in background
                        [{ref: self.genomeRef, included:
                                        ["/features/[*]/aliases",
                                            "/features/[*]/annotations",
                                            "/features/[*]/function",
                                            "/features/[*]/id",
                                            "/features/[*]/location",
                                            "/features/[*]/protein_translation_length",
                                            "/features/[*]/dna_translation_length",
                                            "/features/[*]/type"]
                            }],
                        function (data) {
                            self.genomeFeatures = data[0].data.features;
                        },
                        function (error) {
                            self.clientError(error);
                        }
                );
      
                //allow sorting for num with html (sType : "num-html")
                //also add sorting for checkboxes
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
                    },
                    "checkbox-custom-pre": function (a) {
                        //get value from ' value = "' + geneIDtoDisplay + '"
                        var x = String(a).split(" value = ");
                        x = String(x[1]).split('"');
                         
                        return parseFloat($(".checkboxGene"+self.pref + "[value='"+x[1]+"']").attr('valuechecked'));
                    },
                    "checkbox-custom-asc": function (a, b) {
                        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
                    },
                    "checkbox-custom-desc": function (a, b) {
                        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
                    },
                    "checkboxGC-custom-pre": function (a) {
                        //get value from ' value = "' + geneIDtoDisplay + '"
                        var x = String(a).split(" value = ");
                        x = String(x[1]).split('"');
                         
                        return parseFloat($(".checkboxGC"+self.pref + "[value='"+x[1]+"']").attr('valuechecked'));
                    },
                    "checkboxGC-custom-asc": function (a, b) {
                        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
                    },
                    "checkboxGC-custom-desc": function (a, b) {
                        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
                    },
                    "checkboxGB-custom-pre": function (a) {
                        //get value from ' value = "' + geneIDtoDisplay + '"
                        var x = String(a).split(" value = ");
                        x = String(x[1]).split('"');
                         
                        return parseFloat($(".checkboxGB"+self.pref + "[value='"+x[1]+"']").attr('valuechecked'));
                    },
                    "checkboxGB-custom-asc": function (a, b) {
                        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
                    },
                    "checkboxGB-custom-desc": function (a, b) {
                        return ((a < b) ? 1 : ((a > b) ? -1 : 0));
                    }
                });

                // Launch jobs and vizualize data once they are done
                $.when.apply($, [jobGetBarSeqExperimentResultsProperties,jobGetGenomeFeatures]).done(function () {
                    self.loading(false);
                    self.prepareVizData();
                    
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
                        "aaSorting": [[0, "desc"],[1, "desc"],[2, "desc"]],
                        "aoColumns": [
                            {sTitle: "Plot", mData: "plotCheckBoxExp", "bSortable": true},
                            {sTitle: "Description", mData: "experimentDescription"},
                            {sTitle: "Sick Genes", mData: "sickGenes", sType: "num-html"},
                            {sTitle: "Sick Genes Long", mData: "sickGenesLong", bVisible: false, bSearchable: true}
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
                        var checkBoxPlot = '<input type = "checkbox" class = "checkboxExp' + self.pref + '"'
                                +
                                ' value = "' + i +'">'; //sPlot used index wihin the array

                        // Build reference to sick genes from a particular experiment
                        var genesRefs =
                                '<a class="show-genes' + self.pref + '"'
                                + ' data-expID="' + expID + '"'
                                + '>' + sickGenes.length + '</a>';

                        // add table data row            
                        experimentsTableData.push(
                                {
                                    'plotCheckBoxExp': checkBoxPlot,
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
                        //console.log("Event Exp triggered: " + $(this).attr('value'));    

                        $('.checkboxExp' + self.pref).unbind('click');
                        $('.checkboxExp' + self.pref).click(function () {
                            self.sPlots.set_selected_dataSet(Number($(this).attr('value')));

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
                                    {sTitle: "Gene", mData: "geneID"}, //"sWidth": "15%"
                                    {sTitle: "Description", mData: "geneDescription"}
                                ],
                                "oLanguage": {
                                    "sEmptyTable": "No genes found!",
                                    "sSearch": "Search: "
                                }
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
                                    'geneDescription': geneFunc
                                });
                            }

                            geneTableSettings.aaData = geneTableData;
                            tabPane.kbaseTabs('addTab', {tab: expID, content: tabContent, canDelete: true, show: true});
                            tableGenes.dataTable(geneTableSettings);

                        });
                        eventsMoreDescription();
                    };
                    
                    //calls in right order creation of Genes, GeneCart and BoxedGenes tabs
                    function createAllGeneTabs(showGenes, showGeneCart, showGenesBoxed){
                        createGenesTab(showGenes);
                        createGeneCartTab(showGeneCart);
                        createGenesBoxedTab(showGenesBoxed);
                    }
                    createAllGeneTabs(false, false, false); //at the beginning don't front show them
                    
                    //////////////////// Build tab with all genes  ////////////////////////////////////////////
                    function createGenesTab(showTab) {
                        showTab = showTab || false;

                        if (tabPane.kbaseTabs('hasTab', "Genes")) {
                          tabPane.kbaseTabs('removeTab', "Genes");
                        }

                        var tabContent = $("<div/>");
                        tabPane.kbaseTabs('addTab', {tab: 'Genes', content: tabContent, canDelete: false, show: showTab});
                        var tableGenes = $('<table class="table table-striped table-bordered" ' +
                                'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="' + self.pref + 'genes-table"/>');
                        tabContent.append(tableGenes);
                        var geneTableSettings = {
                            "sPaginationType": "full_numbers",
                            "iDisplayLength": 10,
                            "aaData": [],
                            "aaSorting": [[0, "desc"], [1, "desc"], [2, "asc"]],
                            "aoColumns": [
                                {sTitle: "Gene Cart", mData: "plotCheckBoxGene", sType: "checkbox-custom"},
                                //{sTitle: "Plot", mData: "plotCheckBoxGene", "bSortable": true, "orderDataType": "dom-checkbox"}, 
                                {sTitle: "Gene", mData: "geneID"}, //"sWidth": "15%"
                                {sTitle: "Description", mData: "geneDescription"}
                            ],
                            "oLanguage": {
                                "sEmptyTable": "No genes found!",
                                "sSearch": "Search: "
                            },
                            'fnDrawCallback': eventsGeneTab
                        };

                        var geneTableData = [];

                        for (var gi in self.annotatedGenes) {
                            var geneIDtoDisplay = self.genomeFeatures[ gi ].id;

                            var geneFunc = self.genomeFeatures[ gi ]['function'];
                            if (!geneFunc) {
                                geneFunc = '-';
                            }

                            var valuechecked = 0;
                            var showchecked = "";
                            if(undefined !== self.geneCart[ geneIDtoDisplay ]){
                                valuechecked = 1;
                                showchecked = "checked";
                            }
                            var checkBoxPlot = '<input type = "checkbox" class = "checkboxGene' + self.pref + '"'
                                    +
                                    ' value = "' + geneIDtoDisplay + '" valuechecked = ' + valuechecked + ' ' + showchecked + ' >'; //onclick="function(a){this.valuechecked = a.checked;}

                            /*$(".checkboxGene" + self.pref).change(function () {
                             console.log("Event checkbox: " + this.checked);
                             if ($(this).attr('valuechecked') === 0) {
                             $(this).attr('valuechecked', 1);
                             } else {
                             $(this).attr('valuechecked', 0);
                             }
                             
                             if (this.checked) {
                             //Do stuff
                             }
                             });*/
                            geneTableData.push({
                                'plotCheckBoxGene': checkBoxPlot,
                                'geneID': geneIDtoDisplay,
                                'geneDescription': geneFunc
                            });
                        }
                        geneTableSettings.aaData = geneTableData;
                        tableGenes.dataTable(geneTableSettings);
                    };
                    
                    function eventsGeneTab() {
                        //console.log("Event Gene triggered: " + $(this).attr('value'));
                        
                       
                        var a = '<input type = "checkbox" class = "checkboxGeneX value = Gene valuechecked = 10 >';
                        var x = a.split("valuechecked = ");
                        //console.log("Test parsing: " +x[0] + " : " + x[1] + " : " + (3+parseFloat(x[1])));
                       
                        //action
                        $('.checkboxGene' + self.pref).unbind('click');
                        $('.checkboxGene' + self.pref).click(function () {
                            //for sorting that uses valuechecked !!! use (a) a.checked?
                            if ($(this).attr('valuechecked') === 0) {
                                $(this).attr('valuechecked', 1);
                            } else {
                                $(this).attr('valuechecked', 0);
                            }
                       
                            if(this.checked){
                                $(this).attr('valuechecked', 1);
                            }else{
                                $(this).attr('valuechecked', 0);
                            }
                            //console.log("Adding point to tag0 checked: " + $(this).attr('valuechecked') + " : " + this.checked);

                            //console.log("Adding point to tag0: " + $(this).attr('value'));

                            self.sPlots.addPointToTag("globalSelection", $(this).attr('value'));
                            if(undefined === self.geneCart[ $(this).attr('value') ]){
                                self.geneCart[ $(this).attr('value') ] = 1;
                            }else{
                                delete self.geneCart[ $(this).attr('value') ];
                            }
                            
                            createAllGeneTabs(true, false, false);
                            
                            //$(this).attr('value')
                            //if($(this).is(":checked")) {
                            //    $('#plotareaContainer').append("p").text( "Chekced" + $(this).attr('value') );
                            //}else{
                            //    $('#plotareaContainer').append("p").text( "Un Chekced" + $(this).attr('value') );
                            //}
                        });
                    };
                    
                    //receives selected genes (from the brush selection) from sPlots
                    function listenerBrushEvent(points) {
                        self.genesBoxed = {};
                    
                        //copy array to an associate array
                        for (var i in points) {
                            self.genesBoxed[ points[i] ] = 1;
                        }
                        //update tab
                        createAllGeneTabs(false,false,true); 
                    }    
                    function createGenesBoxedTab(showTab) {
                        showTab = showTab || false;
                        
                        if (tabPane.kbaseTabs('hasTab', "Boxed Genes")) {
                          tabPane.kbaseTabs('removeTab', "Boxed Genes");
                        }

                        //return if empty
                        if(Object.keys(self.genesBoxed).length < 1){
                            return;
                        }
                        
                        var tabContent = $("<div/>");

                        var tableGenes = $('<table class="table table-striped table-bordered" ' +
                                'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="' + self.pref + expID + '-table"/>');
                        tabContent.append(tableGenes);
                        var geneTableSettings = {
                            "sPaginationType": "full_numbers",
                            "iDisplayLength": 10,
                            "aaData": [],
                            "aaSorting": [[1, "asc"], [2, "desc"]],
                            "aoColumns": [
                                {sTitle: "Gene Cart", mData: "plotCheckBoxGene", sType: "checkboxGB-custom"},
                                {sTitle: "Gene", mData: "geneID"}, //"sWidth": "15%"
                                {sTitle: "Description", mData: "geneDescription"}
                            ],
                            "oLanguage": {
                                "sEmptyTable": "No genes found!",
                                "sSearch": "Search: "
                            },
                            'fnDrawCallback': eventsGenesBoxedTab
                        };

                        var geneTableData = [];

                        for (var geneID in self.genesBoxed) {
                            
                            var geneFunc = self.genomeFeatures[ self.geneID2index[geneID] ]['function'];
                            if (!geneFunc) {
                                geneFunc = '-';
                            }
                            
                            var valuechecked = 0;
                            var showchecked = "";
                            if(undefined !== self.geneCart[ geneID ]){
                                valuechecked = 1;
                                showchecked = "checked";
                            }
                            var checkBoxPlot = '<input type = "checkbox" class = "checkboxGB' + self.pref + '"'
                                    +
                                    ' value = "' + geneID + '" valuechecked = ' + valuechecked + ' ' + showchecked + ' >'; //onclick="function(a){this.valuechecked = a.checked;}

                            geneTableData.push({
                                'plotCheckBoxGene': checkBoxPlot,
                                'geneID': geneID,
                                'geneDescription': geneFunc
                            });
                        }

                        geneTableSettings.aaData = geneTableData;
                        tabPane.kbaseTabs('addTab', {tab: "Boxed Genes", content: tabContent, canDelete: true, show: showTab});
                        tableGenes.dataTable(geneTableSettings);
                    };
                
                    function eventsGenesBoxedTab() {
                        //action
                        $('.checkboxGB' + self.pref).unbind('click');
                        $('.checkboxGB' + self.pref).click(function () {
                            //console.log("eventsGeneCartTab1: showTab : "+showTab);
                        
                            self.sPlots.addPointToTag("globalSelection", $(this).attr('value'));
                            if(undefined === self.geneCart[ $(this).attr('value') ]){
                                self.geneCart[ $(this).attr('value') ] = 1;
                            }else{
                                delete self.geneCart[ $(this).attr('value') ];
                            }
                            
                            //update tab
                            createAllGeneTabs(false,false,true); //front-show Gene Cart after a gene is removed
                        });
                    };
                    
                    function createGeneCartTab(showTab) {
                        showTab = showTab || false;
                        
                        if (tabPane.kbaseTabs('hasTab', "Gene Cart")) {
                          tabPane.kbaseTabs('removeTab', "Gene Cart");
                        }

                        var tabContent = $("<div/>");

                        var tableGenes = $('<table class="table table-striped table-bordered" ' +
                                'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="' + self.pref + expID + '-table"/>');
                        tabContent.append(tableGenes);
                        var geneTableSettings = {
                            "sPaginationType": "full_numbers",
                            "iDisplayLength": 10,
                            "aaData": [],
                            "aaSorting": [[1, "asc"], [2, "desc"]],
                            "aoColumns": [
                                {sTitle: "Remove", mData: "plotCheckBoxGene", sType: "checkboxGC-custom"},
                                {sTitle: "Gene", mData: "geneID"}, //"sWidth": "15%"
                                {sTitle: "Description", mData: "geneDescription"}
                            ],
                            "oLanguage": {
                                "sEmptyTable": "No genes found!",
                                "sSearch": "Search: "
                            },
                            'fnDrawCallback': eventsGeneCartTab
                        };

                        var geneTableData = [];

                        for (var geneID in self.geneCart) {
                            var geneFunc = self.genomeFeatures[ self.geneID2index[geneID] ]['function'];
                            if (!geneFunc) {
                                geneFunc = '-';
                            }
                            
                            var valuechecked = 0;
                            if(undefined !== self.geneCart[ geneID ]){
                                valuechecked = 1;     
                            }
                            var checkBoxPlot = '<input type = "checkbox" class = "checkboxGC' + self.pref + '"'
                                +
                                ' value = "' + geneID + '" valuechecked = '+valuechecked+' >'; //onclick="function(a){this.valuechecked = a.checked;}
                      
                            geneTableData.push({
                                'plotCheckBoxGene': checkBoxPlot,
                                'geneID': geneID,
                                'geneDescription': geneFunc
                            });
                        }

                        geneTableSettings.aaData = geneTableData;
                        tabPane.kbaseTabs('addTab', {tab: "Gene Cart", content: tabContent, canDelete: false, show: showTab});
                        tableGenes.dataTable(geneTableSettings);
                    };
                    
                    function eventsGeneCartTab() {
                        //action
                        $('.checkboxGC' + self.pref).unbind('click');
                        $('.checkboxGC' + self.pref).click(function () {
                            //console.log("eventsGeneCartTab1: showTab : "+showTab);
                        
                            self.sPlots.addPointToTag("globalSelection", $(this).attr('value'));
                            if(undefined === self.geneCart[ $(this).attr('value') ]){
                                self.geneCart[ $(this).attr('value') ] = 1;
                            }else{
                                delete self.geneCart[ $(this).attr('value') ];
                            }
                            
                            //update Gene Cart
                            createAllGeneTabs(false,true,false); //front-show Gene Cart after a gene is removed
                        });
                    };
                    
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


                
                    /*============================================================
                     * init scatter plots
                     *============================================================
                     */
                    self.sPlots = $.scatterPlots( self.pref );
                    
                    //prepare gene descriptors (long description is needed when the mouse moves over a point) 
                    var point2desc = [];
                    for (var g in self.annotatedGenes) {
                        var geneFunc = self.genomeFeatures[ g ]['function'];
                        if (!geneFunc) {
                            geneFunc = '';
                        }
                        point2desc[ self.genomeFeatures[ g ].id ] = geneFunc;
                    }
                    
                    //set data for scatter plots
                    self.sPlots.setDataFrom2Dmatrix(self.barSeqExperimentResultsData.features_by_experiments, point2desc);
                    
                    //add a call-back function when points are selected with a mouse
                    self.sPlots.addBrushEventSelectCallback( listenerBrushEvent );
                            
                    //add scatter plots html elements to the current div
                    container.append(self.sPlots.plotAreaContainer);
                    document.getElementById(self.pref+'plotareaContainer').insertAdjacentHTML('beforeend', self.sPlots.plotHeader);
                    //console.log("Width: " + self.$elem.width());      
                    
                    //init scatterplot graphics
                    self.sPlots.initGraphics(self.$elem.width());
                    
                    //add tag to color selected points
                    self.sPlots.addTag("globalSelection", "#ff4d00");
                    //$('#'+self.pref+'plotareaContainer').find("#plotarea").empty(); //clean allocated area      
                    //============================================================                   
                });
            });
        },
        prepareVizData: function () {
            var self = this;

            self.experiments = [];
            self.genesToLog = [];
            self.annotatedGenes = {};
            self.experimentToSickGenes = {};
            self.geneID2index = self.barSeqExperimentResultsData.row_to_index;
            
            self.experimentsCount = self.barSeqExperimentResultsData.experiments.length;

            for (var iExp = 0; iExp < self.barSeqExperimentResultsData.experiments.length; iExp++) {
                var experArray = self.barSeqExperimentResultsData.experiments[ iExp ][1];

                var minV = 999;
                var maxV = -999;

                //shorten experiment name !!!
                var t = String(self.barSeqExperimentResultsData.experiments[ iExp ][0].name).split("|");
                if (t.length > 0) {
                    self.barSeqExperimentResultsData.experiments[ iExp ][0].name_short = String(t[ t.length - 1 ]).replace(/_/g, " ");
                }

                if (typeof self.experimentToSickGenes[ self.barSeqExperimentResultsData.experiments[ iExp ][0].name ] !== 'undefined') {
                        console.log("prepareVizData " + iExp + " Prior Sick length: " + self.experimentToSickGenes[
                                self.barSeqExperimentResultsData.experiments[ iExp ][0].name
                        ].length);
                }
                for (var i = 0; i < experArray.length; i++) {

                    //typedef tuple<feature_ref f_ref,int strain_index,int count_begin,int count_end,float norm_log_ratio> bar_seq_result;

                    var geneIndex = experArray[i][0];
                    var geneName = self.genomeFeatures[ geneIndex ].id;
                    var logRatio = experArray[i][4];

                    self.annotatedGenes[ geneIndex ] = 1;

                    self.genesToLog.push(
                            {
                                'gene': geneName,
                                'logRatio': logRatio,
                                'experiment': experArray[i][0].name
                            }
                    );

                    if (!((geneName) in self.plotData["values"])) {
                        self.plotData["values"][geneName] = {};
                    }
                    self.plotData["values"][geneName][iExp] = logRatio;
                    self.plotData["values"][geneName]["dataPointName"] = geneName;
                    self.plotData["values"][geneName]["dataPointDesc"] = geneName;

                    maxV = Math.max(maxV, logRatio);
                    minV = Math.min(minV, logRatio);

                    //console.log(iExp + " " + self.barSeqExperimentResultsData.experiments[ iExp ][0]);
                    if (logRatio < -2) {
                        if (typeof self.experimentToSickGenes[ self.barSeqExperimentResultsData.experiments[ iExp ][0].name ] === 'undefined') {
                            self.experimentToSickGenes[
                                    self.barSeqExperimentResultsData.experiments[ iExp ][0].name
                            ] = [];
                        }
                        self.experimentToSickGenes[
                                self.barSeqExperimentResultsData.experiments[ iExp ][0].name
                        ].push(geneIndex);
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

            /*for (var g in self.genomeFeatures) {
             console.log('Geneid1: '+ g);
             console.log('Geneid2: '+ self.genomeFeatures[ g ].id);
             console.log('Geneid3: '+ self.genomeFeatures[ g ]['function']);
             
             }*/
            for (var g in self.annotatedGenes) {
                var geneFunc = self.genomeFeatures[ g ]['function'];
                if (!geneFunc) {
                    geneFunc = '-';
                }
                self.plotData["dataPointObjs"].push(
                        {
                            "dataPointName": self.genomeFeatures[ g ].id, // names are unique and cannot be numbers, otherwise access ["g"] doesnot work
                            "dataPointDesc": geneFunc
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
        }
    });
})(jQuery);
