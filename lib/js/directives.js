;(function () {
  
  'use strict';
  
  angular.module('pdb.uniprot.viewer', ["pdb.prints",'d3Core','pdb.uniprot.viewer.filters','pdb.uniprot.viewer.services','pdb.common.services','template/sequenceView/uniPdb.html'])
	.directive('pdbUniprotViewer', ['d3', 'uniprotViewerService', '$compile', '$filter', '$interval', 'commonServices', '$document', '$window', '$q', function(d3, uniprotViewerService, $compile, $filter, $interval, commonServices, $document, $window, $q){
    
		return{
		  restrict: 'EAC',
		  scope: {
			entryId: '@',
			height: '@',
			width: '@',
			hidePdbPrints: '@'
		  },
		  
		  templateUrl: "template/sequenceView/uniPdb.html",
		  
		  link: function (scope, element, attrs) {
				
				scope.seqViewerOverlay = {
					width: '90%',
					height: '100%',
					'background-color': 'rgba(0,0,0,0.5)',
					color: '#fff',
					'z-index': 1,
					position: 'absolute',
					'text-align': 'center',
					padding: '0 5%',
					'webkit-box-sizing': 'content-box',
					'-moz-box-sizing': 'content-box',
					'box-sizing': 'content-box',
				}
				scope.seqViewerOverlayMessage = {
					'display': 'inline-block',
					'margin-top': '5%',
					'font-size': '12px'
				}
              
				scope.overlayText = 'Loading...';
				
				//Component Element Selectors  
				var directiveEle = d3.select(element[0]);
				var wapperDiv = directiveEle.select('.seqViewerWrapper');
				var topSvgDiv = wapperDiv.select('.topRightSection')
				var bottomSvnDiv = wapperDiv.select('.bottomRightSection')
				var svgEle = bottomSvnDiv.select('.bottomSvg');
				var svgMainGroup = svgEle.select('g.shapesGrp');
				var svgScaleGroup = topSvgDiv.select('g.scaleGrp');
            
				//get parent element dimensions
				var parentDimensions = directiveEle.node().parentNode.getBoundingClientRect();
              
				//default config
				scope.config = {
					width: parentDimensions.width > 230 ? parentDimensions.width : 230,
					height: parentDimensions.height > 250 ? parentDimensions.height : 250, 
					showLabels: true, 
					maxZoomed: false,
					pdbPrints: true,
					firstPrintsMarginTop: 3
				}
				
				//set default
				if(typeof scope.hidePdbPrints != 'undefined' && scope.hidePdbPrints == 'true'){
					scope.config.pdbPrints = false;
				}
				
				if( typeof scope.height != 'undefined'){
					scope.config.height = scope.height;
				}
				if( typeof scope.width != 'undefined'){
					scope.config.width = scope.width;
				}
				
				//Default flag settings
				scope.activeViewBtn = 'compact';  //Compact button active on compact/expanded view button
				scope.showViewBtn = true; //Flag to hide/show compact/expanded view button
				scope.allowZoom = true;
				scope.showLabels = scope.config.showLabels; //To hide/show lables in template
				scope.printsMarginTop = scope.config.firstPrintsMarginTop;
            
				//section wise dimension calculation
				var dimensions = new (function(){
						this.margin = {
								top: 15,
								right: 10,
								bottom: 15,
								left: 10
						};
						this.topSvgHeight = 70;
						this.topButtonHeight = 45;
						this.headerSecHeight = 60;
						this.mainHeight = scope.config.height;
						this.leftSecWidthCalc = function(){
								var width = scope.config.width > 300 ? 210 : 110;
								width = scope.config.pdbPrints ? width : 110;
								return width;
						};
						this.leftSecWidth = this.leftSecWidthCalc();
						this.scrollbarWidth = 25;
						this.scrollRightMargin = 5;
						this.mainWidth = scope.config.width;
						this.sectionWidth = this.mainWidth - this.scrollRightMargin;
						this.bottomSecHeigth = this.mainHeight - this.topSvgHeight - this.headerSecHeight - this.margin.bottom;
						this.svgWidth = this.sectionWidth - this.leftSecWidth - this.scrollbarWidth;
						this.svgScaleWidth = this.svgWidth - 20;
						this.tickCount = this.svgWidth / 28;
						this.seqViewerSmallOverlay = 'position: absolute;padding: 5px;color: #fff;background-color: rgba(0, 0, 0, 0.498039);width: 27%;font-size: 10px;margin-left: 40%;top:0;text-align:center;';
						this.accWidth = this.leftSecWidth > 110 ? 150 : 57;
				})();
				
				//Template Styles
				scope.styles = {
					wrapper: {'width': dimensions.mainWidth+'px', 'height': dimensions.mainHeight+'px'},
					loaderImg: {'margin-top': ((dimensions.mainHeight/2) - 30)+'px'},
					topSection: {'height': dimensions.topSvgHeight+'px', 'width': dimensions.sectionWidth+'px'},
					topSvg: {'height': dimensions.topSvgHeight+'px', 'width': dimensions.svgWidth+'px', overflow: 'visible'},
					bottomSection:  {
									'height': dimensions.bottomSecHeigth+'px',
									'width': dimensions.sectionWidth+'px',
									'overflow-x': 'hidden',
									'overflow-y': 'auto'
									},
					bottomSvg: {'width': dimensions.svgWidth+'px', overflow: 'visible'},
					leftSecStyle: { 'width': dimensions.leftSecWidth+'px'},
					scrollArrowLeft: {'display': 'none', 'position':'absolute', 'margin': '8px 0 0 '+ (dimensions.leftSecWidth - 10) +'px', 'text-decoration': 'none', 'border':'none', 'outline':'none'},
					scrollArrowRight: {'display': 'none', 'margin': '8px 0 0 20px', 'text-decoration': 'none', 'border':'none', 'outline':'none'},
					loadMoreStyle: {'top': dimensions.mainHeight - 35+'px','left': (dimensions.mainWidth/2) - 50+'px' },
					btnGrp: {'float':'left','margin-bottom':'5px','width': dimensions.mainWidth+'px','text-align':'right','overflow': 'auto'},
					accWidth: {'width': dimensions.accWidth+'px'}
				};
            
				//storing wrapper size in scope to hide/show template sections
				scope.wrapperSize = {
					width: dimensions.mainWidth,
					height: dimensions.mainHeight
				}
				
				//Validate Mandatory Parameters
				if(typeof scope.entryId === 'undefined'){
					scope.overlayText = 'Please specify \'entry-id\'';
					return;
				}
            
				//if tooltip element do not exist append new
				var toolTipEle = d3.select('.pdbSeqTooltip');
				if(toolTipEle[0][0] == null){
					toolTipEle = d3.select('body').append('div').attr('class','pdbSeqTooltip')
				}
            
				//default events
				scope.pdbevents = commonServices.createNewEvent(['PDB.uniprotViewer.click','PDB.uniprotViewer.mouseover','PDB.uniprotViewer.mouseout']);
	      
				//Component class
				var UniprotViewerComponent = (function () {
					function UniprotViewerComponent() {
						
						this.smallSeqFlag = false; //Flag for small sequence
						this.shapeMaster = {}; //object to store different shapes type created
						this.renderViewModel = undefined;
						this.seqLength = 0;
						this.scaleConfig = undefined; //Actual values will be set in the view render method
						this.xScale = undefined;
						this.line = undefined;
						this.zoom = undefined;
						this.xAxis = undefined;
						this.seqAxis = undefined;
						this.tickCount = dimensions.tickCount;
						this.clipPathId = undefined;
						
						this.initUniPdbViewer();
											
					};
					UniprotViewerComponent.prototype.initUniPdbViewer = function (entities) {
						var _this = this;
						scope.overlayText = 'Downloading UniPDB API Data...';
                        
						//Get api data for unipdb
						uniprotViewerService.getUnipdbData(scope.entryId).then(function(serviceDataModel) {
                       
								//Format api data into data model required for renderView() method
								scope.overlayText = 'Parsing UniPDB API Data...';
								_this.renderViewModel = $filter('uniProtMappingFilter')(serviceDataModel);
								_this.initScaleAndZoom(); //initialize d3 scale and zoom
														
								//set heading text
								wapperDiv.select('.headingTxt').html(_this.renderViewModel.options.unipdbHeading)
								
								_this.initPDBPrints(); //initialize PDBPrints component
								
								scope.overlayText = 'Rendering View...';
								_this.renderShapes(_this.renderViewModel); //initialize shape drawing and render
								
								//Hide buttons if sequence is small
								if(_this.smallSeqFlag){
										scope.showViewBtn = false;
								}
													
								//set svg height
								_this.setMainSvgHeight();
														
								//Scale to max zoom if set in options
								if(scope.config.maxZoomed){
										_this.zoom.scale(_this.scaleConfig.maxZoom);
										_this.zoomDraw();
								}
								
								scope.overlayText = '';
								
								//Get Mutation annotations for loaded pdb entries
								if(_this.renderViewModel.equalLengthpdbIdArr.length > 0){
									_this.renderMutationAnnotationsForUniPDB(_this.renderViewModel.equalLengthpdbIdArr);
								}
								
								//load mappings for unequal pdb-uniprot segments
								if(_this.renderViewModel.unequalLengthpdbIdArr.length > 0){
									_this.loadUnequalLengthMappings().then(function(uniprotSegData){
										_this.renderMutationAnnotationsForUniPDB(_this.renderViewModel.unequalLengthpdbIdArr);
									});
								}
								
								//Get uniprot pfam annotations
								//_this.renderPfamAnnotations();
								
								//Scale to max zoom if set in options
								if(scope.config.maxZoomed){
										_this.zoom.scale(maxZoom);
										_this.zoomDraw();
								}
								
								//Hide View buttons if sequence is small
								if(_this.smallSeqFlag){
										scope.showViewBtn = false;
								}
														
														
						}, function(error) { //deffered end
								scope.overlayText = 'Unipdb API request failed...';
								if(window.console){ console.log('Unipdb API request failed. Error: '+ error) }
						});
                    
					};
					//Method to download and display pfam annotaions in unipdb
					UniprotViewerComponent.prototype.renderMutationAnnotationsForUniPDB = function(pdbIdList){
							var _this = this;
							//show loading message
							wapperDiv.append('div')
									.classed('smallOverlayMutation', true)
									.text('Loading Mutation/Modified Annotation..')
									.attr('style', dimensions.seqViewerSmallOverlay)
										
							var apiNameList = ['mutatedResidues','modifiedResidues','molecules'];
							var promiseList = commonServices.createPromise(pdbIdList, apiNameList);
							
							commonServices.combinedDataGrabber(promiseList, pdbIdList, apiNameList, true).then(function(result) {
									var formattedDataModel = $filter('unipdbModelFilter')(result, dimensions.margin.top, directiveEle);
									_this.renderShapes(formattedDataModel);
									wapperDiv.select('.smallOverlayMutation').remove(); //Remove Messsage
							}, function() {
									wapperDiv.select('.smallOverlayMutation').remove(); //Remove Messsage
									if (window.console) console.log('combined Failed');
							});
					};
					//Method to get uniprot segments for unequal pdb-uniprot mappings
					UniprotViewerComponent.prototype.loadUnequalLengthMappings = function(){
							var _this = this;
							scope.fadedShapeData = _this.renderViewModel.fadedShapeData;
							
							var deferred = $q.defer();
							
							//show loading message
							wapperDiv.append('div')
									.classed('smallOverlayMutation', true)
									.text('Loading remaining mappings data..')
									.attr('style', dimensions.seqViewerSmallOverlay)
										
							var apiNameList = ['uniprotSegments'];
							var promiseList = commonServices.createMultiPromise(_this.renderViewModel.unequalLengthpdbIdArr, apiNameList);
							
							commonServices.combinedDataGrabber(promiseList, _this.renderViewModel.unequalLengthpdbIdArr, apiNameList, true).then(function(result) {
								
								//parse api result and get mappings
								var segmentMappingsData = {};
								angular.forEach(result, function(segmentData, pdbIdKey) {
									segmentMappingsData[pdbIdKey] = segmentData.uniprotSegments.UniProt[scope.entryId].mappings;
								});
								
								
								var combinedApiData = {
									uniprotId: scope.entryId,
									uniprotSegmentMappings: segmentMappingsData,
									fadedShapeData: scope.fadedShapeData
								};
								
								var dataModel = $filter('uniProtMappingFilter')(combinedApiData);
								
								//remove groups and faded structures
								dataModel.groups = [];
								wapperDiv.selectAll('.loadingseq').remove();
								wapperDiv.selectAll('.loadingpath').remove();
								wapperDiv.selectAll('.loading_path_text').remove();
								_this.renderShapes(dataModel);
								
								//update info tooltip text
								angular.forEach(dataModel.infoIconMsg, function(msg, pdbid){
									scope.infoIconMsg[pdbid] = msg;
								});
								
								wapperDiv.selectAll('.smallOverlayMutation').remove(); //Remove Messsage
								
								deferred.resolve(dataModel);
								
							}, function() {
									wapperDiv.select('.smallOverlayMutation').remove(); //Remove Messsage
									if (window.console) console.log('combined Failed');
									
									deferred.reject('fail response');
							});
							
							return deferred.promise;
					};
					//Method to intialize PDBPrints component
					UniprotViewerComponent.prototype.initPDBPrints = function () {
						var _this = this;
									//load PDBPrints if width > 300
						if(scope.config.width > 300 && scope.config.pdbPrints){
							var pdbIdArrStr =  "['"+_this.renderViewModel.pdbIdArr.join("','")+"']";
											var printsTemplate = wapperDiv.select('.bottomLeftSection')
																							.classed("pdb-prints", true)
																							.attr('pdb-ids', pdbIdArrStr)
																							.attr('settings', '{"orientation": "horizontal", "size": 24, "color": "embl_green", "hideLogo" : ["PDBeLogo","Taxonomy", "Expressed", "Protein"] }')
											$compile(printsTemplate.node())(scope);
									}
					};
					//Method to intialize d3 scale and zoom after downloading api data
					UniprotViewerComponent.prototype.initScaleAndZoom = function () {
							var _this = this;
							scope.overlayText = 'Initalizing scale and zoom...';

							//Set template scope dependency data
							scope.infoIconMsg = _this.renderViewModel.infoIconMsg;
							scope.pathLeftLabels = _this.renderViewModel.pathLeftLabels;
							scope.pathMoreLeftLabels = [];
							scope.pdbIdArr = _this.renderViewModel.pdbIdArr;
							scope.entrySummary = _this.renderViewModel.options;
							scope.modelOptions = scope.entrySummary;
							_this.sequenceArr = scope.entrySummary.seqStr.split('');
							_this.seqLength =  _this.sequenceArr.length

							_this.scaleConfig = {
									indexMax: _this.seqLength - 1,
									minZoom: 1,
									maxZoom: _this.getMaxZoom(_this.seqLength, dimensions.svgScaleWidth)
							}

							//SmallSeqFlag is set true if sequence length is smaller than width 
							//which displays the sequence on load without zoom
							if( _this.seqLength <= Math.ceil(dimensions.tickCount)){
									_this.tickCount = _this.seqLength;
									_this.smallSeqFlag = true;
							}
							
							//Define scale function (x-scale as we only zoom horizontally)
							_this.xScale = d3.scale.linear().domain([0,_this.scaleConfig.indexMax]).range([0,dimensions.svgScaleWidth]);
							
							//Define line function used to get path 'd' value using start and end value
							_this.line = d3.svg.line().x(function(d,i) { return _this.xScale(d[0]); });
							
							//Define top x-axis (numerical)
							_this.xAxis = d3.svg.axis()
															.scale(_this.xScale).orient("top")
															.tickFormat(function(d) { return d + 1; })
															.ticks(_this.tickCount);
							
							//Initialize sequence axis (shown on path as residues)
							_this.seqAxis = d3.svg.axis()
																	.scale(_this.xScale).orient("top")
																	.tickFormat(function(d) { return _this.sequenceArr[d]; })
																	.ticks(_this.tickCount);
								
							//Initialize top axis                   
							var topAxis = svgScaleGroup.select("g.x.axis").call(_this.xAxis);
				
							//Set small sequence flag by comparing top axis tick count 
							if(_this.seqLength === topAxis.selectAll('g.tick')[0].length){
									_this.smallSeqFlag = true;
							}            
							
							//Initialize d3 zoom
							_this.zoom = d3.behavior.zoom().on("zoom", function(){_this.zoomDraw(_this)}).x(_this.xScale).scaleExtent([_this.scaleConfig.minZoom, _this.scaleConfig.maxZoom]);
							
							//Append zoom event
							topSvgDiv.select(".topSvg").call(_this.zoom);
							bottomSvnDiv.select(".shapesGrp").call(_this.zoom);
							
							//Append clip path def to svg which is used to display path only below scale 
							_this.clipPathId = 'clipper_'+Math.floor((Math.random() * 500) + 1);
							svgEle
									.append('defs')
									.append('clipPath')
									.attr('id', _this.clipPathId)
									.append('rect')
											.attr('x', -10)
											.attr('y', -30)
											.attr('width', dimensions.svgWidth)
											.attr('height', 100);
							
					};
					//Method to initialize view rendering after downloading api data
					UniprotViewerComponent.prototype.renderShapes = function (seqCompModel) {
						var _this = this;
						
						for(var modelKey in seqCompModel){
	
								if(modelKey === 'groups'){
										
									var totalgroups = seqCompModel[modelKey].length;
									
									for(var grpI = 0; grpI < totalgroups; grpI++){
										
										var grpClass = seqCompModel[modelKey][grpI]['class'];
										var grpParentClass = seqCompModel[modelKey][grpI]['parentGroup'];
										var grpMarginTop = seqCompModel[modelKey][grpI]['marginTop'];
										var grpLabel =  seqCompModel[modelKey][grpI]['label'];
										
										var grpSection = svgMainGroup;
										if(grpParentClass === 'uniprotGrp' || grpClass === 'uniprotGrp'){
												grpSection = svgScaleGroup;
										}
										
										if(grpParentClass !== ''){
												grpSection.select('.'+grpParentClass)
												.append("g").attr("class", grpClass)
												
												if(typeof grpMarginTop != 'undefined' && grpMarginTop){
														grpSection.select('.'+grpClass).attr("transform", "translate(0," + (grpMarginTop) + ")")
												}
										}else{
												grpSection.append("g")
												.attr("class", grpClass)
														.attr("transform", "translate(0," + (dimensions.margin.top + grpMarginTop) + ")")
														.attr('clip-path', 'url(#'+_this.clipPathId+')')
										}
											
									}
										
								}else if(modelKey === 'shapes'){
										
									var totalShapes = seqCompModel[modelKey].length;
									
									for(var shapeI = 0; shapeI < totalShapes; shapeI++){
										var shapeType = seqCompModel[modelKey][shapeI]['shape'];
										var shapeGroupClass = seqCompModel[modelKey][shapeI]['shapeGroupClass'];
										var shapeClass = seqCompModel[modelKey][shapeI]['shapeClass'];
										var shapeContent = seqCompModel[modelKey][shapeI]['shapeContent'];
										var shapeColour = seqCompModel[modelKey][shapeI]['shapeColour'];
										var shapeHeight = seqCompModel[modelKey][shapeI]['shapeHeight'];
										var shapeMarginTop = seqCompModel[modelKey][shapeI]['marginTop'];
										var shapeCap = seqCompModel[modelKey][shapeI]['shapeCap'];
										var shapeShowTooltip = seqCompModel[modelKey][shapeI]['showTooltip'];
										var shapeFitInPath = seqCompModel[modelKey][shapeI]['fitInPath'];
										
										if(typeof shapeHeight === 'undefined'){
												shapeHeight = 0;
										}
										
										if(typeof shapeMarginTop === 'undefined'){
												shapeMarginTop = 0;
										}
										
										if(typeof shapeCap === 'undefined'){
												shapeCap = 'butt';
										}
										
										if(shapeType === 'text'){
												_this.drawText(shapeContent, shapeGroupClass, shapeClass, shapeShowTooltip, shapeFitInPath);
												_this.displaySeq(); //Hide/show seq axis on zoom
										}else if(shapeType === 'zigzag'){
												_this.drawZigzag(shapeContent, shapeGroupClass, shapeClass, shapeColour, shapeHeight, shapeMarginTop, shapeCap, shapeShowTooltip);
										}else if(shapeType === 'arrow'){
												_this.drawArrow(shapeContent, shapeGroupClass, shapeClass, shapeColour, shapeHeight, shapeMarginTop, shapeCap, shapeShowTooltip);
										}else if(shapeType === 'path'){
												_this.drawPath(shapeContent, shapeGroupClass, shapeClass, shapeColour, shapeHeight, shapeMarginTop, shapeCap, shapeShowTooltip);
										}else if(shapeType === 'circle' || shapeType === 'square' || shapeType === 'triangle-up' ||
												shapeType === 'triangle-down' || shapeType === 'diamond' || shapeType === 'cross'){
												_this.createShape(shapeType, shapeContent, shapeGroupClass, shapeClass, shapeColour, shapeShowTooltip, shapeMarginTop)
										}else  if(shapeType === 'sequence'){
												_this.drawSeqAxis(shapeContent, shapeGroupClass, shapeClass, shapeMarginTop, shapeShowTooltip);
												_this.displaySeq(); //Hide/show seq axis on zoom
										}
							
									}
										
								} //else shapes end
						
						}//for end here
							
					};
					//Method to set main/bottom svg height
					UniprotViewerComponent.prototype.setMainSvgHeight = function(){
							var heightCorrection = 40;
							svgEle.select('.seqSvgBg').attr('height',20);
							var shapesGrpDims = svgMainGroup.node().getBBox();
							svgEle.attr('height',shapesGrpDims.height + heightCorrection);
							svgEle.select('.seqSvgBg').attr('height',shapesGrpDims.height + heightCorrection);
					};
					//Method to draw text on path
					UniprotViewerComponent.prototype.drawText = function(textData, textGroupClass, textClass, textShowTooltip, textFitInPath){
						var _this = this;
						var newText = directiveEle.select('.'+textGroupClass)
								.attr('clip-path', 'url(#'+_this.clipPathId+')')
								.selectAll('path.'+textClass)
								.data(textData)
								.enter()
								.append('text')
										.attr('class', function(d, i) { d.textIndex = i; return 'textEle '+textClass+' '+textClass+'-' + i; })
										.attr('x', function(d){ return _this.xScale(d.textRange[0][0]) })
										.attr('y', function(d){ return d.textRange[1][0] })
										.attr('fill',"white")
										.text(function(d){return d.textString; })
										.style('text-anchor', function(d){
											
												//Attach event on data item
												if(textShowTooltip === true){
													_this.attachMouseEvent(d3.select(this), 'text', 'white', d);
												}
												
												if(typeof d.textAnchor !== 'undefined'){
														return d.textAnchor;
												}else{
														return 'middle';
												}
										})
										.style('font-family', 'Verdana,sans-serif')
										.style('font-size', '12px')
										.style('cursor', 'default')
						
						if(textFitInPath === true){
								_this.fitTextInPath(newText);
								newText.classed('fitTextInPath', true);
								newText.style('display', 'none')
						}
					
					};
					//Method to fit text into path width
					UniprotViewerComponent.prototype.fitTextInPath = function(textSelector){
						var _this = this;
						textSelector.each(function(d){
							var textElement = d3.select(this);
							var textEleData = textElement.data()[0];
							var correspondingPathWidth = directiveEle.select('.'+textEleData.pathClassPrefix+'-'+textEleData.textIndex).node().getBBox().width;
												_this.textFontResize(textElement, correspondingPathWidth)
						});
					}
					//Recursive function to fit text into path width
					UniprotViewerComponent.prototype.textFontResize = function(textElement, pathWidth){
							var _this = this;
							var currentTextBoxWidth = textElement.node().getBBox().width;
							if(currentTextBoxWidth > pathWidth){
									var currentFontSize = parseInt(textElement.style('font-size'));
									if(currentFontSize > 2){
											textElement.style('font-size', (currentFontSize - 2) + 'px');
											_this.textFontResize(textElement, pathWidth); //recursively call the medthod until text fits in the path width
									}else{
											textElement.style('font-size', '0px');
									}
							}
					};
					//Method to draw zigzag on path
					UniprotViewerComponent.prototype.drawZigzag = function(pathData, pathGroupClass, pathClass, pathColor, pathHeight, pathMarginTop, pathCap, pathShowTooltip){
						var _this = this;
						directiveEle.select('.'+pathGroupClass)
								.attr('clip-path', 'url(#'+_this.clipPathId+')')
								.selectAll('path.'+pathClass)
								.data(pathData)
								.enter()
								.append('path')
								.attr('class', function(d, i) { return 'linkerPathEle '+pathClass+'-' + i; })
								.attr('stroke', function(d) { return d3.rgb(d.color[0],d.color[1],d.color[2]).brighter(); })
								.attr('stroke-width',2)
								.attr('stroke-linecap', pathCap)
								.attr('fill', function(d) { return d3.rgb(d.color[0],d.color[1],d.color[2]).brighter(); })
								.attr("transform", "translate(0,-9)")
								.attr('d', function(d){
										
										if(pathShowTooltip == true){
												var rgbColor = d3.rgb(d.color[0],d.color[1],d.color[2]).brighter();
												_this.attachMouseEvent(d3.select(this), 'path', rgbColor, d);
										}
										
										var dNewVal = _this.getZigZagdVal(_this.xScale(d.pathStart), d.pathPosition);
										return dNewVal;
								});
						
				};
				//Method to get zigzag path d value
				UniprotViewerComponent.prototype.getZigZagdVal = function(startPoint, pathPosition){
				  
				  var prefixArr = ['M','0L','0L','3L','6L','9L','12L', '15L', '18L'];
				  var addFlag = 0;
				  var dNewVal = '';
				  var diffRange = 5;
				  
				  if(pathPosition === 'start'){
					diffRange = -5;
				  }
				  
				  angular.forEach(prefixArr, function(prefixVal, index) {
					var dPushVal = 0;
					if(addFlag === 0){
					  addFlag = 1;
					  dPushVal = startPoint;
					}else{
					  addFlag = 0;
					  dPushVal = startPoint + diffRange;
					}
					dNewVal += prefixVal+''+dPushVal+','; 
				  });
				  
				  dNewVal += '18 Z';
				  
				  return dNewVal;
				};
				//Method to draw different d3 path shapes
				UniprotViewerComponent.prototype.createShape = function(shapeType, shapeData, shapeGroupClass, shapeClass, shapeColor, shapeShowTooltip, shapeMarginTop){
					var _this = this;
					_this.shapeMaster[shapeClass] = shapeType;
	
					directiveEle.select('.'+shapeGroupClass)
					.attr('clip-path', 'url(#'+_this.clipPathId+')')
					.selectAll('otherPathShape path.'+shapeClass)
					.data(shapeData)
					.enter()
						.append('path')
						.attr('class', shapeClass)
						.attr('d', _this.getShapeDVal(shapeType))
						.attr('fill', function(d){
							var shapeFillColor;
							if(typeof d.color !== 'undefined'){
								shapeFillColor = d3.rgb(d.color[0],d.color[1],d.color[2]).brighter();	
							}else{ 
								shapeFillColor = shapeColor;
							}
							
							//Attach events
							if(shapeShowTooltip == true){
								_this.attachMouseEvent(d3.select(this), 'circle', shapeFillColor, d);
							}
							
							return shapeFillColor;
						})
						.attr('stroke','none')
						.attr('stroke-width',0)
						.attr('transform',function(d,i){
							var translateStr = "translate("+(_this.xScale(d.residue_number - 1))+","+(10)+")"; 
							if(shapeMarginTop !== 0){
								translateStr = "translate("+(_this.xScale(d.residue_number - 1))+","+(shapeMarginTop)+")"; 
							}
							return translateStr;
						});
			  
				};
				//Method to get shape path d value
				UniprotViewerComponent.prototype.getShapeDVal = function(shapeType){
					var _this = this;
				    return d3.svg.symbol().type(shapeType)
						    .size(function(d){ return _this.smallSeqFlag ? 40 : _this.getShapeSize(_this.zoom.scale()) * 10 });
				};
				//Method to get shape size value
				UniprotViewerComponent.prototype.getShapeSize = function(shapeSize){
						if(shapeSize < 1.7){
								shapeSize = 1.7;
						}else if(shapeSize > 4.5){
								shapeSize = 4.5;
						}
						return shapeSize;
				};
				//Method to draw Seq axis shown as residues on path
				UniprotViewerComponent.prototype.drawSeqAxis = function(shapeContent, seqGrpClass, seqClass, seqMarginTop, seqShowTooltip){
					var _this = this;
					//Add group
					directiveEle.select('.'+seqGrpClass).append("g").attr("class", "seqAxis "+seqClass);
					
					var axisEle = directiveEle.select("."+seqClass);
					
					//Add axis
					axisEle.call(_this.seqAxis);
					if(seqMarginTop && typeof seqMarginTop != 'undefined'){
							axisEle.attr("transform", "translate(0," + (seqMarginTop) + ")");
					}
					
					//attach events
					if(seqShowTooltip == true){
						_this.attachMouseEvent(axisEle, 'text', 'white', shapeContent);
					}
					
				};
				//Method to draw path
				UniprotViewerComponent.prototype.drawPath = function(pathData, pathGroupClass, pathClass, pathColor, pathHeight, pathMarginTop, pathCap, pathShowTooltip){
					var _this = this;
					directiveEle.select('.'+pathGroupClass)
							.attr('clip-path', 'url(#'+_this.clipPathId+')')
							.selectAll('path.'+pathClass)
							.data(pathData)
							.enter()
							.append('path')
									.attr('class', function(d, i) { return 'pathEle '+pathClass+'-' + i; })
									.attr('stroke', function(d){
											var thisPathColor;
											if(typeof d.color !== 'undefined'){
													var rgbColor = d3.rgb(d.color[0],d.color[1],d.color[2]).brighter();
													thisPathColor = rgbColor;
											}else{
													thisPathColor = pathColor;
											}
											
											//attach events
											if(pathShowTooltip == true){
												_this.attachMouseEvent(d3.select(this), 'path', thisPathColor, d);
											}
											return thisPathColor;
									})
									.attr('stroke-width',pathHeight)
									.attr('stroke-opacity', function(d){
											if(typeof d.opacity !== 'undefined'){
													return d.opacity;
											}else{
													return 1;
											}
									})
									.attr('stroke-linecap', pathCap)
									.attr('fill', 'none')
									.attr("transform", "translate(0," + pathMarginTop + ")")
									.attr('d', function(d){ return _this.line(d.pathRange)});
				};
				//Method to draw arrow (secondary structure)
				UniprotViewerComponent.prototype.drawArrow = function(pathData, pathGroupClass, pathClass, pathColor, pathHeight, pathMarginTop, pathCap, pathShowTooltip){
					var _this = this;
					directiveEle.select('.'+pathGroupClass)
							.attr('clip-path', 'url(#'+_this.clipPathId+')')
							.selectAll('path.'+pathClass)
							.data(pathData)
							.enter()
							.append('path')
									.attr('class', function(d, i) { return 'arrowEle '+pathClass+'-' + i; })
									.attr('stroke', function(d) {
											var arrowColor = d3.rgb(d.color[0],d.color[1],d.color[2]).brighter();
											//bind event
											if(pathShowTooltip == true){
													_this.attachMouseEvent(d3.select(this), 'arrow', arrowColor, d);
											}
											
											return arrowColor; 
									})
									.attr('stroke-width',pathHeight)
									.attr('stroke-linecap', pathCap)
									.attr('fill', function(d) { return d3.rgb(d.color[0],d.color[1],d.color[2]).brighter(); })
									.attr("transform", "translate(0," + pathMarginTop + ")")
									.attr('d', function(d){ return _this.getArrowDVal(_this.line(d.pathRange)); });
				
				};
				//Method to draw arrow d value
				UniprotViewerComponent.prototype.getArrowDVal = function(oldDVale){
						var dValArr = oldDVale.split(',');
						var startNum = parseFloat(dValArr[0].substring(1));
						var endNum = parseFloat(dValArr[1].substring(2));
						
						var pathLength = (endNum - startNum) + 1;
						var diffVal = 5;
						if(pathLength < 10){
								diffVal = pathLength - 2;
						}
						
						var newdStr = 'M'+startNum+',-5'+
														'L'+(endNum - diffVal)+',-5'+
														'L'+(endNum - diffVal)+',-10'+
														'L'+endNum+',0'+
														'L'+(endNum - diffVal)+',10'+
														'L'+(endNum - diffVal)+',5'+
														'L'+startNum+',5'
						
						return newdStr;
				};
				//Method to calculate Max zoom (limit) to stop zooming when residues are shown on the path
				UniprotViewerComponent.prototype.getMaxZoom = function(seqLength, width){
				    var _this = this;
					//This calculation formula is dervied from observed zoom values
					var maxZoom = 0;
					if(width % 100 === 0){
						maxZoom = (0.2112 * seqLength) / _this.getZoomDivisor(width);
					}else{
						var floorVal = Math.floor(width/100)*100;
						if(floorVal < 1)floorVal = 100;
						var floorZoomVal = (0.2112 * seqLength) / _this.getZoomDivisor(floorVal);
						var zoomMatrix = {
								100 : {diff: 2, range: [1,2,4,7,9]},
								200 : {diff: 1.5, range: [2,5]},
								300 : {diff: 0.9, range: [4,9]},
								400 : {diff: 0.7, range: [5,9]},
								500 : {diff: 0.6, range: [1,9]},
								600 : {diff:0.45, range: [8,9]},
								700 : {diff:0.4, range: [8,9]}
						}

						if(width < 800){

								var rangeLength = zoomMatrix[floorVal]['range'].length;
								for(var rangeIndex = rangeLength - 1; rangeIndex >= 0; rangeIndex--){
										if(width >= floorVal + (zoomMatrix[floorVal]['range'][rangeIndex] * 10)){
												if(rangeIndex === 0){
														maxZoom = floorZoomVal;
												}else{
														maxZoom = floorZoomVal - ((((zoomMatrix[floorVal]['diff']) / 100) * seqLength)  * rangeIndex);
												}
												break;
										}

								}
						}else{
								maxZoom = (0.2112 * seqLength) / _this.getZoomDivisor(floorVal);
						}

					}

					if(maxZoom === 0){
						maxZoom = floorZoomVal;
					}

				    return maxZoom;
			    };
				UniprotViewerComponent.prototype.getZoomDivisor = function (num){
					//This calculation formula is derived from observed zoom values
					var divisor = 1;
					if(num > 100){
							divisor = Math.floor(Math.floor(num) / 100)
					}
					return divisor;
			    };
				//Method to hide/show sequence on path depending on zoom
				UniprotViewerComponent.prototype.displaySeq = function(){
					var _this = this;
					if(_this.smallSeqFlag || _this.zoom.scale() === _this.scaleConfig.maxZoom){
							
							directiveEle.selectAll('.linkerPathEle')
									.attr('d', function(d){
											var newStartVal = 0;
											if(d.pathPosition === 'start'){
													newStartVal = d.pathStart - 0.1;
											}else{
													newStartVal = d.pathStart + 0.1;
											}
											var dNewVal = _this.getZigZagdVal(_this.xScale(newStartVal), d.pathPosition);
											return dNewVal;
									});
							
							directiveEle.selectAll('.seqPath')
									.attr('d', function(d){
											var lineStr = _this.line(d.pathRange); //normal return value
											var lineArr = lineStr.split(',');
											lineArr[0] = 'M' + (parseFloat(lineArr[0].substring(1)) - 5);
											lineArr[1] = '0L' + (parseFloat(lineArr[1].substring(2)) + 5);
											return lineArr.join(',');
									});
							
							directiveEle.selectAll('.nonSeqPath')
									.attr('d', function(d){
											var lineStr = _this.line(d.pathRange); //normal return value
											var lineArr = lineStr.split(',');
											if(parseFloat(lineArr[0].substring(1)) > 0){
											lineArr[0] = 'M' + (parseFloat(lineArr[0].substring(1)) + 5);
											}
											lineArr[1] = '0L' + (parseFloat(lineArr[1].substring(2)) - 5);
											return lineArr.join(',');
									})
							
							//Reset path lines (unipdb)
							var linePathEle = directiveEle.selectAll('.linePathEle');
							linePathEle.each(function(d){
									d3.select(d3.select(this).node())
											.attr('d', function(d){
													var lineStr = _this.line(d.pathRange);
													var lineArr = lineStr.split(',');
													var firstPoint = parseFloat(lineArr[0].substring(1)) + 5;
													var lineArrLen = lineArr.length;
													lineArr[0] = 'M' + firstPoint;
													var lastPoint = parseFloat(lineArr[lineArrLen - 2].substring(2)) - 5;
													lineArr[lineArrLen - 2] = '5L' + lastPoint;
													
													return lineArr.join(',')
											});
							});
							
							directiveEle.selectAll(".seqAxis").style('display','block');
							directiveEle.selectAll(".hideTextOnZoom").style('display','none');
							directiveEle.selectAll(".showTextOnZoom").style('display','block');
					}else{
							directiveEle.selectAll(".seqAxis").style('display','none');
							directiveEle.selectAll(".hideTextOnZoom").style('display','block');
							directiveEle.selectAll(".showTextOnZoom").style('display','none');
					}
			
				};
				//Method to resize on zoom
				UniprotViewerComponent.prototype.zoomDraw = function() {
					var _this = this;
					//Show horizontal scroll icons if zoom > 1 
					if(_this.zoom.scale() > 1){
							directiveEle.selectAll('.SeqScrollArrow').style('display','block');
					}else{
							directiveEle.selectAll('.SeqScrollArrow').style('display','none');
					}
					
					//Disable zoom if expanded
					if(scope.allowZoom === false){
							_this.zoom.scale(_this.scaleConfig.maxZoom);
					}
					
					//Set the Min-Max for the pan scroll
					var trans = _this.zoom.translate(), scale = _this.zoom.scale(),
					tx = Math.min(0, Math.max(dimensions.svgScaleWidth * (1 - scale), trans[0])),
					ty = Math.min(0, Math.max(1 * (1 - scale), trans[1]));
					_this.zoom.translate([tx, ty]);
					
					//Reset x axis
					svgScaleGroup.select("g.x.axis").call(_this.xAxis);
					
					//Reset paths
					directiveEle.selectAll('.pathEle').each(function(d){
							d3.select(this).attr('d', _this.line (d.pathRange));
					});
					
					//Resent secondray structure strands
					directiveEle.selectAll('.arrowEle').each(function(d){
							d3.select(this).attr('d', _this.getArrowDVal(_this.line(d.pathRange)));
					});
					
					//Reset linker paths (unipdb)
					directiveEle.selectAll('.linkerPathEle').each(function(d){
							var dNewVal = _this.getZigZagdVal(_this.xScale(d.pathStart), d.pathPosition);
							d3.select(d3.select(this).node()).attr('d', dNewVal);
					});
					
					//Reset the sequence axis
					directiveEle.selectAll(".seqAxis").call(_this.seqAxis);
					
					//Reset custom shapes
					for(var shapeClass in _this.shapeMaster){
							directiveEle.selectAll('.'+ shapeClass)
									.attr('d', _this.getShapeDVal(_this.shapeMaster[shapeClass]))
									.attr('transform',function(d,i){ 
									var translateStr = "translate("+(_this.xScale(d.residue_number - 1))+","+(10)+")"; 
											if(typeof d.marginTop != 'undefined' && d.marginTop !== 0){
													translateStr = "translate("+(_this.xScale(d.residue_number - 1))+","+(d.marginTop)+")"; 
											}
											return translateStr;
									});
					}
					
					_this.displaySeq(); //Hide/show seq axis on zoom
					
					//Reset text on the Path elements
					directiveEle.selectAll('.textEle').each(function(d){
							var textEle = d3.select(this);
							var textEleData = textEle.data()[0];
							textEle
							.attr('x', function(d){ return _this.xScale(d.textRange[0][0]) });
							
							//Set the font size for fit in path option
							if(typeof textEleData !== 'undefined' && typeof textEleData.fitInPath !== 'undefined' && textEleData.fitInPath === true){
									textEle.style('font-size','12px');
									_this.fitTextInPath(textEle);
							}
					});
					
				};
				//Method to fit in method
				UniprotViewerComponent.prototype.initFitTextInPath = function(){
					var _this = this;
					directiveEle.selectAll('.fitTextInPath').each(function(d){
							var textEle = d3.select(this);
							var textEleData = textEle.data()[0];
							textEle.style('display','block');
							
							textEle
							.attr('x', function(d){ return _this.xScale(d.textRange[0][0]) });
							
							//Set the font size for fit in path option
							if(typeof textEleData !== 'undefined' && typeof textEleData.fitInPath !== 'undefined' && textEleData.fitInPath === true){
									//textEle.style('font-size','12px');
									_this.fitTextInPath(textEle);
							}
					});
				}
				//Method to show tooltip
				UniprotViewerComponent.prototype.showTooltip = function(tooltipMsg, elementType, e){
						var y = 0, x = 0;
						
						//Event type is used to know the elementType of mouse event d3/ng
						if(elementType === 'ng'){
								x = e.pageX;
								y = e.pageY;
						} else {
								x = d3.event.pageX;
								y = d3.event.pageY;
						}
						
						toolTipEle.html(tooltipMsg).style('display','block').style('top', y + 15 +'px').style('left', x + 10 +'px');
				};
				//Method to hide tooltip
				UniprotViewerComponent.prototype.hideTooltip = function(){
						toolTipEle.style('display','none');
				};
				//Method to get Residue details from scale coordinates for tooltip
				UniprotViewerComponent.prototype.getResidue = function(coordinates, eleType){
					var _this = this;                    
					var residueIndex = coordinates[0];
					if(eleType !== 'circle'){
							residueIndex = Math.round(_this.xScale.invert(coordinates[0]));
					}
					return 'Residue ' + (residueIndex + 1) + ' (' + _this.sequenceArr[residueIndex] + ')';
				};
				//Method to dispatch custom events
				UniprotViewerComponent.prototype.dispatchEvent = function (eventType, eventData, eventElement) {
					var dispatchEventElement = element[0];
					if(typeof eventElement !== 'undefined'){
						dispatchEventElement = eventElement;
					}
					if(typeof eventData !== 'undefined'){
						scope.pdbevents[eventType]['eventData'] = eventData;
					}
					dispatchEventElement.dispatchEvent(scope.pdbevents[eventType])
				};
				//Method to perform event operations
				UniprotViewerComponent.prototype.eventOperations = function(eventType, eleObject, eleType, pathColor, mouseCordinates, eleData){
					var _this = this;
					var toolTipContent;
					var tooltipPosition;
					
					if(typeof eleData !== 'undefined'){
						toolTipContent = eleData.tooltipMsg;
						tooltipPosition = eleData.tooltipPosition;
					}
					
					//For shapes other than path
					if(eleType === 'circle'){
						mouseCordinates[0] = eleData.residue_number - 1;
					}
					
					var residueDetails = _this.getResidue(mouseCordinates, eleType);
					if(angular.isUndefined(toolTipContent)){
						toolTipContent = residueDetails;
					}else {
						if(!angular.isUndefined(tooltipPosition) && tooltipPosition === 'prefix'){
								toolTipContent = toolTipContent+' '+residueDetails;
						}else if(!angular.isUndefined(tooltipPosition) && tooltipPosition === 'postfix'){
								toolTipContent = residueDetails+' '+toolTipContent;
						}
					}
					
					/*if(eleType === 'path' || eleType === 'circle'){
						eleObject.attr('stroke', pathColor.brighter());
					}else if(eleType === 'arrow'){
						eleObject.attr('stroke', pathColor.brighter()).attr('fill', pathColor.brighter());
					}*/
					
					//show tooltip
					if(eventType == 'PDB.uniprotViewer.mouseover'){
						_this.showTooltip(toolTipContent, 'd3', mouseCordinates);
					}
					
					//Dispatch custom click event
					_this.dispatchEvent(eventType, {
						viewerType: 'pdbViewer',
						elementData : eleData,
						residueNumber : parseInt(residueDetails.split(' ')[1]),
						entryId: scope.entryId
					});
				};
				//Method to attach mouse events
				UniprotViewerComponent.prototype.attachMouseEvent = function(eleObject, eleType, pathColor, eleData){
					var _this = this;
					eleObject.on('click', function(){
						var mouseCordinates = d3.mouse(this);
						_this.eventOperations('PDB.uniprotViewer.click', eleObject, eleType, pathColor, mouseCordinates, eleData);
						return;
						
					}).on('mouseover', function(){
						var mouseCordinates = d3.mouse(this);
						_this.eventOperations('PDB.uniprotViewer.mouseover',eleObject, eleType, pathColor, mouseCordinates, eleData);
						return;
						
					})
					.on('mousemove', function(){
						var mouseCordinates = d3.mouse(this);
						_this.eventOperations('PDB.uniprotViewer.mouseover', eleObject, eleType, pathColor, mouseCordinates, eleData);
						return;
						
					})
					.on('mouseleave', function(){
						
						/*if(eleType === 'path'){
								d3.select(this).attr('stroke', pathColor.darker().brighter())
						}else if(eleType === 'arrow'){
								d3.select(this)
								.attr('stroke', pathColor.darker().brighter())
								.attr('fill', pathColor.darker().brighter());
						}*/
						_this.hideTooltip();
						
						//Dispatch custom mouseout event
						_this.dispatchEvent('PDB.uniprotViewer.mouseout', {
							viewerType: 'pdbViewer',
							entryId: scope.entryId
						});
					
					});
				}
                
					return UniprotViewerComponent;
					
			})(); //UniprotViewerComponent() end here
            
			//Instantiate LiteMolApp
			var UniprotViewer = new UniprotViewerComponent();
            
			//Methods in scope for template level operations
			
			//Watch View button to change view
			scope.$watch('activeViewBtn', function() {
					if(typeof UniprotViewer.zoom === 'undefined') return;
					if(scope.activeViewBtn === 'expanded'){
							UniprotViewer.zoom.scale(UniprotViewer.scaleConfig.maxZoom);
							UniprotViewer.zoomDraw();
							scope.allowZoom = false;
					}else{
							UniprotViewer.zoom.scale(1);
							scope.allowZoom = true;
							UniprotViewer.zoomDraw();
					}
			});
            
			//Pan Left/Right
			var ArrowPromise;
			scope.movePan = function(size){
					var t = UniprotViewer.zoom.translate();
					UniprotViewer.zoom.translate([t[0] + size, t[1]]);
					UniprotViewer.zoomDraw();
					
					ArrowPromise = $interval(function () {
							var t1 = UniprotViewer.zoom.translate();
							UniprotViewer.zoom.translate([t1[0] + size, t1[1]]);
							UniprotViewer.zoomDraw();
					}, 100);
			}
			
			scope.stopMovingPan = function(size){
					$interval.cancel(ArrowPromise);
			}
            
			//Tooltip hide/show methods in scope for template level binding
			scope.showTooltip = function(tooltipMsg, elementType, e){
				UniprotViewer.showTooltip(tooltipMsg, elementType, e);
			}
			
			scope.hideTooltip = function(){
				UniprotViewer.hideTooltip();
			}
			            
			
		} //link Fn End
		  
	}
}]);
  
  
}());