;(function () {

  'use strict';
  
  angular.module('pdb.uniprot.viewer.filters', ['d3Core','pdb.uniprot.viewer.services','pdb.common.services'])
	.filter('uniProtMappingFilter', ['commonServices', '$filter', function(commonServices, $filter){ //Filter to convert the response data into required data model format
		
		return function(respData){
			
			var uniPdbDataModel = {
					groups: [],
					shapes: [],
					infoIconMsg: {}
			}
			var sortedMappingsObject = {};
			if(typeof respData.uniprotSegmentMappings == 'undefined'){
		
				//If best structure mappings api data is available iterate to get the pdb id sequence
				var pdbIdsInOrder = [];
				if(typeof respData.bestStrMappings !== 'undefined'){
					var totalBestMappingRecs = respData.bestStrMappings.length;
					
					for(var bestRecIndex = 0; bestRecIndex < totalBestMappingRecs; bestRecIndex++){
						var checkPdbId = respData.bestStrMappings[bestRecIndex].pdb_id;
						if(pdbIdsInOrder.indexOf(checkPdbId) === -1){
							pdbIdsInOrder.push(checkPdbId);
							sortedMappingsObject[checkPdbId] = respData.pdbMappings[checkPdbId];
						}
					}
				}else{
					sortedMappingsObject = respData.pdbMappings;
				}
			
				//Initial Model object for drawing shapes
				uniPdbDataModel = {
					options: {
						seqId: respData.uniprotId,
						seqStr: respData.uniprotSeq,
						unipdbHeading: respData.unipdbHeading,
						totalEntries: 0, //Flag to store total entries count displayed in the title
						totalChains: 0 //Flag to store total chain count displayed in the title
					},
					groups: [
						{ label : respData.uniprotId, class : 'uniprotGrp', parentGroup : '', marginTop: 8},
						{ label : '', class : 'uniprotPathGrp', parentGroup : 'uniprotGrp', marginTop: 1},
						{ label : '', class : 'pfamPathGrp', parentGroup : 'uniprotGrp'},
						{ label : '', class : 'uniprotSeqGrp', parentGroup : 'uniprotGrp', marginTop: 14},
						{ label : '', class : 'pfamLabelGrp', parentGroup : 'uniprotGrp', marginTop: 14}
					],
					shapes: [
						{
							shape : 'path',
							shapeGroupClass : 'uniprotPathGrp',
							shapeClass : 'seqPath uniprotPath',
							shapeHeight : 20,
							marginTop: 0,
							showTooltip: true,
							shapeContent : [
								{
									pathRange : [[0,0],[respData.uniprotSeq.length,0]],
									pathData  : {
										uniprotId: respData.uniprotId,
										uniprotSeq: respData.uniprotSeq
									},
									color: commonServices.specificColors.lightGray,
									elementType: 'uniprot'
								}
							]
						},
						{
							shape : 'sequence',
							shapeGroupClass : 'uniprotSeqGrp',
							shapeClass : 'uniprotSeq',
							showTooltip: true,
							shapeContent : {
								pathRange : [[0,0],[respData.uniprotSeq.length,0]],
								pathData  : {
									uniprotId: respData.uniprotId,
									uniprotSeq: respData.uniprotSeq
								},
								color: commonServices.specificColors.lightGray,
								elementType: 'uniprot'
							}
						}
					],
					pdbIdArr : [],
					equalLengthpdbIdArr : [],
					unequalLengthpdbIdArr : [],
					fadedShapeData: {},
					infoIconMsg : {}
				};
				
				//Get pfam shapes
				if(typeof respData.pfamApiData !== 'undefined'){
					var pfamShapes = $filter('unpToPfamFilter')(respData.pfamApiData, respData.uniprotId);
					if(pfamShapes.shapes[0].shapeContent.length > 0){
						uniPdbDataModel.infoIconMsg['pfam'] = pfamShapes.shapes[0].infoToolTipMsg;
						uniPdbDataModel.shapes.push(pfamShapes.shapes[0]);
						uniPdbDataModel.shapes.push(pfamShapes.shapes[1]);
					}
				}
			
			}else{
				sortedMappingsObject = respData.uniprotSegmentMappings;
			}
		  
		  var initMargin = 0;
			var colorArrIndex = 0;
			angular.forEach(sortedMappingsObject, function(mappingsArr, pdbId) {
				
				//Create groups 'g' for path
				if(typeof respData.uniprotSegmentMappings != 'undefined'){
					initMargin = respData.fadedShapeData[pdbId].initMargin;
					colorArrIndex = respData.fadedShapeData[pdbId].colorIndex;
				}else{
					uniPdbDataModel.options.totalEntries++; //Entry count ++
			  	uniPdbDataModel.options.totalChains++; //Chain count ++
				
					var pathGroupMargin =  initMargin + 20;
					
					uniPdbDataModel.groups.push({ label : pdbId, class : 'pathGrp'+pdbId, parentGroup : '', marginTop: pathGroupMargin});
				
					initMargin += 30;
					
					//Create g to show sequence on path 
					uniPdbDataModel.groups.push({ label : '', class : 'seqGrp'+pdbId, parentGroup : '', marginTop: initMargin + 3});
				}
			  
				//Path Sequence Object
				var pathSeqObj = {  
					shape : 'sequence',
					shapeGroupClass : 'seqGrp'+pdbId,
					shapeClass : 'seq'+pdbId,
					showTooltip: true
				};
			  
			  //Decide shapes
			  var shapeObj = {
				  shape : 'path',
				  shapeGroupClass : 'pathGrp'+pdbId,
				  shapeClass : 'seqPath path'+pdbId+' path'+pdbId,
				  shapeHeight : 20,
				  showTooltip: true,
				  shapeContent : []
				};
				
				var chainTextObj = {
					shape: 'text',
					shapeGroupClass: 'seqGrp'+pdbId,
					shapeClass : 'hideTextOnZoom chain_id_text',
					shapeHeight : 15,
					marginTop : 2,
					showTooltip: true,
					shapeContent : []
				}
				
				var tempRangeArr = [];
			
				var iconMsg = 'This shows how sequences in PDB entry '+pdbId+' '+
							'cover the sequence of UniProt entry '+respData.uniprotId+'.';

				//check uniprot gap probability
				var gapProbability = typeof respData.uniprotSegmentMappings != 'undefined' ? false : commonServices.checkUniportGapProbability(mappingsArr);
			  
				if(gapProbability){

					var loadingPathData = {
						mappingApiData: mappingsArr,
						colorIndex: colorArrIndex,
						initMargin: initMargin
					}
					
					//sequence
					pathSeqObj.shapeClass = 'loadingseq seq'+pdbId
					
					//shape
					shapeObj.shapeClass = 'loadingpath loadingpath'+pdbId;
					shapeObj.shapeContent.push(
						{
							pathRange : [[0,0],[respData.uniprotSeq.length,0]],
							pathData  : loadingPathData,
							color : commonServices.colorBox3[colorArrIndex][0],
							tooltipMsg : 'Loading UniProt mappings for '+pdbId,
							opacity: 0.3
						}
					);
					
					//chain
					chainTextObj.shapeClass = 'loading_path_text';
					chainTextObj.shapeContent.push(
						{
							textRange : [[2,0],[-9,0]],
							textString  : 'Loading UniProt mappings for '+pdbId,
							pathData : loadingPathData,
							textAnchor: 'left'
						}
					);
					
					//Update the PDB ID in the unequalLengthpdbIdArr
					uniPdbDataModel.unequalLengthpdbIdArr.push(pdbId);
					uniPdbDataModel.fadedShapeData[pdbId] = loadingPathData;

				}else{

					//Sort the mapping array to get paths in proper order              
					var sortedMappingsData = mappingsArr.sort(commonServices.sortMappingFragments("unp_start"));
					var colorSubIndex = 0;
					var totalSubColors = commonServices.colorBox3[colorArrIndex].length;
						
					angular.forEach(sortedMappingsData, function(mappingsData, index) {
						var chainTooltipVal = '<br>UniProt range '+mappingsData.unp_start+'-'+mappingsData.unp_end+'<br>PDB range: '+mappingsData.start.residue_number+' - '+mappingsData.end.residue_number;
						var checkRange = mappingsData.unp_start+'-'+mappingsData.unp_end;
						var checkIndex = tempRangeArr.indexOf(checkRange);
						if(checkIndex === -1){
							mappingsData['pathColor'] = commonServices.colorBox3[colorArrIndex][colorSubIndex]; //Added path color to use it in zigzag shape
							shapeObj.shapeContent.push(
								{
									pathRange : [[mappingsData.unp_start - 1,0],[mappingsData.unp_end - 1,0]],
									pathData  : mappingsData,
									color : commonServices.colorBox3[colorArrIndex][colorSubIndex],
									tooltipMsg : chainTooltipVal,
									tooltipPosition: 'postfix',
									type: 'PDB'
								}
							);
							
							chainTextObj.shapeContent.push(
								{
									pathRange : [[mappingsData.unp_start - 1,0],[mappingsData.unp_end - 1,0]],
									textRange : [[mappingsData.unp_start + 2,0],[-9,0]],
									textString  : mappingsData.struct_asym_id,
									pathData : mappingsData,
									color : commonServices.colorBox3[colorArrIndex][colorSubIndex],
									textAnchor: 'left',
									tooltipMsg : chainTooltipVal,
									tooltipPosition: 'postfix',
									type: 'PDB'
								}
							);
							
							/*pathSeqObj.shapeContent.push(
								{
									pathRange : [[mappingsData.unp_start - 1,0],[mappingsData.unp_end - 1,0]],
									pathData : mappingsData,
									tooltipMsg : chainTooltipVal,
									tooltipPosition: 'postfix',
									color : commonServices.colorBox3[colorArrIndex][colorSubIndex],
									type: 'PDB'
								}
							);*/
							
							tempRangeArr.push(mappingsData.unp_start+'-'+mappingsData.unp_end);
							
							colorSubIndex++;
							
							if(colorSubIndex === totalSubColors){
								colorSubIndex = 0;
							}
							
						}else{
							if(typeof respData.uniprotSegmentMappings == 'undefined') uniPdbDataModel.options.totalChains++; //Chain count ++
							shapeObj.shapeContent[checkIndex].pathData.chainId += ','+mappingsData.struct_asym_id;
							chainTextObj.shapeContent[checkIndex].textString += ', '+mappingsData.struct_asym_id;
						}
						
						iconMsg += '<br>- UniProt range '+mappingsData.unp_start+'-'+mappingsData.unp_end+''+
									' ('+((mappingsData.unp_end - mappingsData.unp_start) + 1) +' residues)'+
										'corresponds to residues '+mappingsData.struct_asym_id+':'+mappingsData.start.residue_number+':'+
										' - '+mappingsData.struct_asym_id+':'+mappingsData.end.residue_number+': in PDB entry.';
						
					});
					
					//Update the PDB ID in the equalLengthpdbIdArr
					if(typeof respData.uniprotSegmentMappings == 'undefined') uniPdbDataModel.equalLengthpdbIdArr.push(pdbId);

				}

				uniPdbDataModel.shapes.push(pathSeqObj, shapeObj, chainTextObj);
			
				//Create g to show lines connecting the paths 
			  uniPdbDataModel.groups.push({ label : pdbId, class : 'straightLineGrp'+pdbId, parentGroup : '', marginTop: pathGroupMargin});
				
				uniPdbDataModel.infoIconMsg[pdbId] = iconMsg;
				
				//Color Arrar Index Incrementor
				if(typeof respData.uniprotSegmentMappings == 'undefined'){
					uniPdbDataModel.pdbIdArr.push(pdbId); //PdbIds for pdbprints
					colorArrIndex++;
					if(colorArrIndex === commonServices.colorBox3.length){ //if(colorArrIndex === colorArr.length){ 
						colorArrIndex = 0;
					}
				}
				 
			});
			
			return uniPdbDataModel;
			
		}
	}])
	  
	.filter('modifiedResFilter', ['commonServices', function(commonServices){ //Mutation and modified residues filter (created separate filter to be used for both viewer types)
		return function(apiData, pathData, dataPdbId, shapeHeight, shapeMarginTop, textMarginTop, apiName, viewerType){
		  
		  var modDataModel = [];
	  
		  var checkResidueInRange = function(eleDataObj, residueApiData){
			
			var resDetails = {
			  residueNum: residueApiData.residue_number,
			  chainId: residueApiData.chain_id,
			  entityId: residueApiData.entity_id,
              structAsymId: residueApiData.struct_asym_id
			}
			
			var residueIndex = -1;
			angular.forEach(eleDataObj, function(eleData, dataIndex) {
			  var pathDetails = {
				pdbStart: eleData.pathData.start.residue_number,
				pdbEnd: eleData.pathData.end.residue_number,
				unpStart: eleData.pathRange[0][0] + 1,
				unpEnd: eleData.pathRange[1][0] + 1,
				chainId: eleData.pathData.chain_id,
				entityId: eleData.pathData.entity_id,
                structAsymId: eleData.pathData.struct_asym_id
			  }
			  
			  /*if(resDetails.residueNum >= pathDetails.pdbStart  
			  && resDetails.residueNum <= pathDetails.pdbEnd 
			  && resDetails.chainId <= pathDetails.chainId 
			  && resDetails.entityId <= pathDetails.entityId ){
				residueIndex = resDetails.residueNum - (pathDetails.pdbStart - pathDetails.unpStart);
			  }*/
              if(resDetails.residueNum >= pathDetails.pdbStart  
			  && resDetails.residueNum <= pathDetails.pdbEnd 
			  && resDetails.structAsymId <= pathDetails.structAsymId 
			  && resDetails.entityId <= pathDetails.entityId ){
				residueIndex = resDetails.residueNum - (pathDetails.pdbStart - pathDetails.unpStart);
			  }
			});
			
			return residueIndex;
		  }
		  
		  var shapeObj = {
					shape : 'path',
					shapeGroupClass : 'mutationGrp_'+dataPdbId,
					shapeClass : 'mutation_'+dataPdbId,
					shapeHeight : shapeHeight,
					marginTop : shapeMarginTop,
					showTooltip: true,
					shapeContent : []
				}
				
				//Text shape object for mutation text on top of mutation area
				var textObj = {
					shape : 'text',
					shapeGroupClass : 'mutationGrp_'+dataPdbId,
					shapeClass : 'showTextOnZoom singleTextEle mutation_text_'+dataPdbId,
					shapeHeight : shapeHeight,
					marginTop : shapeMarginTop,
					showTooltip: true,
					shapeContent : []
				}
			
				angular.forEach(apiData, function(apiDataDetails, dataIndex) {
					
					var mutResIndex = apiDataDetails.residue_number;
					if(viewerType === 'unipdbe'){
					  mutResIndex = checkResidueInRange(pathData, apiDataDetails);
					}else{
					  if(apiDataDetails.entity_id != pathData.entityId){
						return;
					  }
					}
				  
				  var tooltipMsg = '';
				  var mutTextData = '';
				  
					if(typeof apiDataDetails.mutation_details !== 'undefined' && apiName === 'mutatedResidues'){ 
					  if(apiDataDetails.mutation_details.from !== null){
					  tooltipMsg += apiDataDetails.mutation_details.from+' --> ';
					}
					  tooltipMsg += apiDataDetails.mutation_details.to+' ('+apiDataDetails.mutation_details.type+')';
					
					  mutTextData = apiDataDetails.mutation_details.to;
					  
					}else{
					  tooltipMsg = 'Modified Residue: '+apiDataDetails.chem_comp_id;
					  mutTextData = '';
					}
					
				  
				  if(mutResIndex > -1){
					//mutation path range
					shapeObj.shapeContent.push(
					  {
						pathRange : [[mutResIndex - 1 - 0.5,0],[mutResIndex - 1 + 0.5,0]],
						tooltipMsg: tooltipMsg,
						pathData  : apiDataDetails,
						color : commonServices.specificColors.burntOrange
					  }
					);
					
					//mutation text range
					textObj.shapeContent.push(
					  {
						textRange : [[mutResIndex - 1,0],[textMarginTop,0]],
						tooltipMsg: tooltipMsg,
						textString  : mutTextData,
						pathData  : apiDataDetails,
						color : commonServices.specificColors.burntOrange
					  }
					);
				  }
			  });
				
				if(shapeObj.shapeContent.length > 0){
			modDataModel.push(shapeObj);
				}
				
				if(textObj.shapeContent.length > 0){
			modDataModel.push(textObj);
				}
		  
		  return modDataModel;
		}
		
	}])
	  
	.filter('unipdbModelFilter', ['d3', '$filter', function(d3, $filter){ //Unipdb model filter
		return function(respData, marginTop, parentEle){
		  
		  var resultDataModel = { groups: [], shapes: [] };
		  
		  var checkResidueInRange = function(eleDataObj, residueApiData){
			
				var resDetails = {
					residueNum: residueApiData.residue_number,
					chainId: residueApiData.chain_id,
					entityId: residueApiData.entity_id,
								structAsymId: residueApiData.struct_asym_id
				}
				
				var residueIndex = -1;
				angular.forEach(eleDataObj, function(eleData, dataIndex) {
					var pathDetails = {
						pdbStart: eleData.pathData.start.residue_number,
						pdbEnd: eleData.pathData.end.residue_number,
						unpStart: eleData.pathRange[0][0] + 1,
						unpEnd: eleData.pathRange[1][0] + 1,
						chainId: eleData.pathData.chain_id,
						entityId: eleData.pathData.entity_id,
						structAsymId: residueApiData.struct_asym_id
					}
					
					if(resDetails.residueNum >= pathDetails.pdbStart  
					&& resDetails.residueNum <= pathDetails.pdbEnd 
					&& resDetails.structAsymId <= pathDetails.structAsymId 
					&& resDetails.entityId <= pathDetails.entityId ){
						residueIndex = resDetails.residueNum - (pathDetails.pdbStart - pathDetails.unpStart);
					}
				});
			
				return residueIndex;
		  }
		  
		  angular.forEach(respData, function(combinedApiData, dataPdbId) {
			
			var pathGrpAttr = parentEle.select('.pathGrp'+dataPdbId).attr('transform');
			var translatePattern = /\((.+),(.+)\)/;
			var matchArr = pathGrpAttr.match(translatePattern);
			//transform cordinates for path group
			var pathGrpCord = [matchArr[1],matchArr[2]];
			//Get data attached to path - array of all paths data for an entry
			var pathData = d3.selectAll('.path'+dataPdbId).data();
			
			angular.forEach(combinedApiData, function(apiData, apiName) {
			  
			  if( typeof apiData != 'undefined' && apiData){
				
				//Check for modified and mutated Residues           
				if(apiName === 'modifiedResidues' || apiName === 'mutatedResidues'){
				  
				  var modResShapObj = $filter('modifiedResFilter')(apiData, pathData, dataPdbId, 20, 10, 14, apiName, 'unipdbe');
				  
				  if(modResShapObj.length > 0){
				  
					resultDataModel.groups.push(
					  { label : '', class : 'mutationGrp mutationGrp_'+dataPdbId, parentGroup : '', marginTop: pathGrpCord[1] - 25 }
					);
					
					resultDataModel.shapes = resultDataModel.shapes.concat(modResShapObj)
				  }
					
				} else if(apiName === 'molecules'){
				  
				  //Check for molecules api data to add linker and related shapes in unipdb seq viewer
				  var zigzagShapeObj = {};
				  var linkerLineObj = {};
				  var totalPathsChecked = 0; //Flag to limit iterations on entity records
				  var prevPathEndResidue = 0;
				  var totMoleculeDataRec = apiData.length;
				  
				  for(var i = 0; i < totMoleculeDataRec; i++){
						  
					//zigzag shape object
					zigzagShapeObj = {
					  shape : 'zigzag',
					  shapeGroupClass : 'pathGrp'+dataPdbId,
					  shapeClass : 'linkerPath'+dataPdbId+' linkerPath'+dataPdbId,
					  shapeHeight : 20,
					  showTooltip: true,
					  shapeContent : []
					};
					
					linkerLineObj = {
					  shape : 'path',
					  shapeGroupClass : 'straightLineGrp'+dataPdbId,
					  shapeClass : 'linePathEle straightLinePath'+dataPdbId+' straightLinePath'+dataPdbId,
					  shapeHeight : 3,
					  showTooltip: true,
					  shapeContent : []
					};
					
					//Loop on all the paths to match entity and check length for that perticular entity
					angular.forEach(pathData, function(pathDataRec, pathDataRecIndex) {
							
						//match entity_id
						if(pathDataRec.pathData.entity_id === apiData[i].entity_id){
							  
							  var entityLength = apiData[i]['length'];
							  var pdbStartResidue = pathDataRec.pathData.start.residue_number;
							  var pdbEndResidue = pathDataRec.pathData.end.residue_number;
							  zigzagShapeObj.shapeColour = pathDataRec.pathData.pathColor;
							  
							//zigzag start if pdb residue starts > 1
							if((prevPathEndResidue === 0 && pdbStartResidue > 1) || 
							(prevPathEndResidue > 0 && prevPathEndResidue < pdbStartResidue)){
							
								var tooltipMsgVal = 'Beginning 1 - '+ (pdbStartResidue - 1) +' residues are not mapped to UniProt';
								if((pdbStartResidue - 1) == 1){
									tooltipMsgVal = 'Residue '+ (pdbStartResidue - 1) +' is not mapped to UniProt';
								}
								
								zigzagShapeObj.shapeContent.push(
									{
										pathStart : pathDataRec.pathData.unp_start - 1,
										pathPosition : 'start',
										tooltipMsg: tooltipMsgVal,
										pathData  : pathDataRec.pathData,
										color: pathDataRec.pathData.pathColor
									}
								);
							
							}
							
							//zigzag end if pdb length < entity length
							if(pdbEndResidue < entityLength){
								
								var tooltipMsgVal1 = 'Ending '+ (parseInt(pdbEndResidue) + 1) +' - '+entityLength+' residues are not mapped to UniProt';
								if((parseInt(pdbEndResidue) + 1) == entityLength){
									tooltipMsgVal1 = 'Residue '+ (parseInt(pdbEndResidue) + 1) +' is not mapped to UniProt';
								}
							
								zigzagShapeObj.shapeContent.push(
									{
										pathStart : pathDataRec.pathData.unp_end - 1,
										pathPosition : 'end',
										tooltipMsg: tooltipMsgVal1,
										pathData  : pathDataRec.pathData,
										color: pathDataRec.pathData.pathColor
									}
								);
							
							}
							
							totalPathsChecked++;
						
							//Add straight line if path residue end and start are consecutive
							if(typeof pathData[pathDataRecIndex + 1] != 'undefined' && 
							pdbEndResidue <= pathData[pathDataRecIndex + 1]['pathData'].start.residue_number &&
							pathData[pathDataRecIndex + 1]['pathData'].unp_start > pathDataRec.pathData.unp_end){
							
								if(pathData[pathDataRecIndex + 1]['pathData'].start.residue_number === pdbEndResidue + 1){
									
										linkerLineObj.shapeContent.push(
											{
												pathRange : [[pathDataRec.pathData.unp_end - 1,0],[pathData[pathDataRecIndex + 1]['pathData'].unp_start - 1,0]],
												tooltipMsg: 'Uniprot Residues '+(parseInt(pathDataRec.pathData.unp_end) + 1)+'-'+(pathData[pathDataRecIndex + 1]['pathData'].unp_start - 1)+' are deleted',
												pathData  : pathDataRec.pathData,
												color: [0,0,0]
											}
										);
									
									}else{
										var ptAddVal = (pathData[pathDataRecIndex + 1]['pathData'].unp_start - pathDataRec.pathData.unp_end)/4;
										
										linkerLineObj.shapeContent.push(
											{
										pathRange : 
										[
											[pathDataRec.pathData.unp_end - 1,0],
											[pathDataRec.pathData.unp_end - 1 + ptAddVal, -5],
											[pathDataRec.pathData.unp_end - 1 + (ptAddVal * 2),0],
											[pathDataRec.pathData.unp_end - 1 + (ptAddVal * 3), 5],
											[pathData[pathDataRecIndex + 1]['pathData'].unp_start - 1,0],
										],
										tooltipMsg: (parseInt(pdbEndResidue) + 1)+'-'+(pathData[pathDataRecIndex + 1]['pathData'].start.residue_number - 1)+' residues are not mapped to UniProt',
										pathData  : pathDataRec.pathData,
										color: [0,0,0]
									}
									);
									
								}
								
							  }
						
					  	  }
							
						  }); //Iteration on path data to match entity end here
						  
						  //Check if all paths for an entry are checked for zigzag
						if(totalPathsChecked == pathData.length){
						  break;
						}
						 
					}
					
					if(linkerLineObj.shapeContent.length > 0){
						resultDataModel.shapes.push(linkerLineObj); //Push in model if there is atleast 1 linker
					  }
					  
				  if(zigzagShapeObj.shapeContent.length > 0){
						resultDataModel.shapes.push(zigzagShapeObj); //Push in model if there is atleast 1 linker
					  }
				  
				} //if api name == molecule
			  
			  } //if apiData != ''
			  
			}); //respData loop
			
		  }); //respData loop
		  
		  return resultDataModel;
		}
	}])
	
	.filter('unpToPfamFilter', ['commonServices', function(commonServices){  //Pfam shape object model filter
		return function(apiData, uniprotId){
		  
		  var pfamShapeObj = {}, pfamTextObj = {};
		  
		  if(!angular.isUndefined(apiData) && apiData){
			
			if(!angular.isUndefined(apiData.data) && apiData.data){
			
			  pfamTextObj = {
				shape : 'text',
				shapeGroupClass : 'pfamLabelGrp',
				shapeClass : 'hideTextOnZoom pfam_text',
				shapeColour : undefined,
				shapeHeight : 15,
				marginTop : 2,
				showTooltip: true,
				shapeContent : [],
				fitInPath: true
			  }
						
			  pfamShapeObj = {
				shape : 'path',
				shapeGroupClass : 'pfamPathGrp',
				shapeClass : 'pfamPath',
				shapeHeight : 30,
				/*shapeCap: 'round',*/
				showTooltip: true,
				shapeContent : [],
				infoToolTipMsg : 'This UniProt entry contains the following Pfam domain:'
			  }
			  
			  var pfamColorIndex = 0;
			  angular.forEach(apiData.data[uniprotId]['Pfam'], function(pfamDetails, pfamDetailsIndex) {
				
				var pfamMappingsLength = pfamDetails.mappings.length;
				var tooltipMsgLine = ' of '+pfamDetails.name+' ('+pfamDetailsIndex+': '+ pfamDetails.description +') mapping to residues ';
				angular.forEach(pfamDetails.mappings, function(pfamMappings, pfamMappingsIndex){
				  
				  //Append ',' or 'and' in tooltip
				  if(pfamMappingsIndex > 0 ){
					if(pfamMappingsIndex === pfamMappingsLength - 1){
					  tooltipMsgLine += ' and'
					}else{
					  tooltipMsgLine += ','
					}
				  }
				  
				  tooltipMsgLine += ' '+pfamMappings.unp_start+'-'+pfamMappings.unp_end;
				  
				  pfamShapeObj.shapeContent.push(
					{
					  pathRange : [[pfamMappings.unp_start - 1,0],[pfamMappings.unp_end - 1,0]],
					  pathData  : {
							pfamId : pfamDetailsIndex,
							pfamData : pfamDetails
					  },
					  color: commonServices.colorGradients.redStack[pfamColorIndex],
						tooltipMsg: '<br><strong>'+pfamDetailsIndex+'</strong><br>UniProt range: '+pfamMappings.unp_start+'-'+pfamMappings.unp_end+'<br>'+pfamDetails.description,
						tooltipPosition: 'postfix'
					}
				  );
				  
				  pfamTextObj.shapeContent.push(
					{
						textRange : [[(pfamMappings.unp_start + ((pfamMappings.unp_end - pfamMappings.unp_start)/2)) - 1,0],[-10,0]],
						textString  : pfamDetails.name,
						pathData : pfamDetails,
						pathClassPrefix : 'pfamPath',
						fitInPath: true,
						tooltipMsg: '<br><strong>'+pfamDetailsIndex+'</strong><br>UniProt range: '+pfamMappings.unp_start+'-'+pfamMappings.unp_end+'<br>'+pfamDetails.description,
						tooltipPosition: 'postfix',
						elementType: 'Pfam'
					}
				  );
				  
				  //Append domain count in tooltip
				  if(pfamMappingsIndex === pfamMappingsLength - 1){
					if(pfamMappingsIndex === 0){
					  tooltipMsgLine = '<br> - one copy'+tooltipMsgLine
					}else{
					  tooltipMsgLine = '<br> - '+pfamMappingsLength+' copies'+tooltipMsgLine;
					}
				  }
				  
				  pfamColorIndex++;
				  if(pfamColorIndex === commonServices.colorGradients.redStack.length){
					  pfamColorIndex = 0;
				  }
				
				});
				
				pfamShapeObj.infoToolTipMsg += tooltipMsgLine;
				tooltipMsgLine = '';
				
			  });
			  
			}  
			
		  }
		  
		  return { shapes: [pfamShapeObj, pfamTextObj] };
		}
		
	}]);

}());