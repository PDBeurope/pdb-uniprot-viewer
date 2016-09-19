angular.module("template/sequenceView/uniPdb.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("template/sequenceView/uniPdb.html",
    	'<div class="seqViewerWrapper" ng-style="styles.wrapper">'+
			'<div ng-style="seqViewerOverlay" ng-show="overlayText != \'\'"><span ng-style="seqViewerOverlayMessage">{{overlayText}}</span></div>'+
			'<div class="unipdbHeader">'+
			  '<div class="headingTxt" ng-show="wrapperSize.width > 300"></div>'+
			  '<div class="button-group" ng-show="showViewBtn">'+
				'<ul>'+
					'<li><a ng-click="activeViewBtn = \'compact\'" ng-class="{\'active\' : activeViewBtn == \'compact\'}" title="Compact View" href="javascript:void(0);">Compact</a></li>'+
					'<li><a ng-click="activeViewBtn = \'expanded\'" ng-class="{\'active\' : activeViewBtn == \'expanded\'}" title="Expanded View" href="javascript:void(0);">Expanded</a></li>'+
				'</ul>'+
			  '</div>'+
			'</div>'+
			'<div class="topSection" ng-style="styles.topSection">'+
			  '<div class="topLeftSection" ng-style="styles.leftSecStyle">'+
			  	'<div class="unipdbMappingDesc">{{modelOptions.totalChains}} chains in {{modelOptions.totalEntries}} PDB entries map to this Uniprot accession.</div>'+
				'<div class="topLeftIconSection">'+
				  '<div class="uniprotHeadId" ng-style="styles.accWidth">'+
					'<a title="Click to go to the UniProt page for this sequence" '+
					'target="_blank" href="//www.uniprot.org/uniprot/{{modelOptions.seqId}}">'+
					  '{{modelOptions.seqId}}'+
					'</a>'+
				  '</div>'+
				  '<div class="infoIconWarpper" ng-show="wrapperSize.width > 300">'+
					'<img ng-src="//www.ebi.ac.uk/pdbe/widgets/html/PinupIcons/Button-Details-icon.png" border="0" '+
					'ng-mousemove="showTooltip(infoIconMsg[\'pfam\'], \'ng\', $event)" ng-mouseleave="hideTooltip()" />'+
					'<a href="//www.uniprot.org/uniprot/{{modelOptions.seqId}}.txt" '+
					'title="See the entry text file" target="_blank" style="margin-left:5px;">'+
					  '<img ng-src="//www.ebi.ac.uk/pdbe/widgets/html/PinupIcons/Button-Download-icon.png" />'+
					'</a>'+
				  '</div>'+
				'</div>'+
			  '</div>'+
			  '<a class="SeqScrollArrow" ng-style="styles.scrollArrowLeft" href="javascript:void(0);" title="Scroll Left">'+
				'<span ng-mouseup="stopMovingPan()" ng-mousemove="stopMovingPan()" ng-mousedown="movePan(50)" class="icon-black" data-icon="&lt;"></span>'+
			  '</a>'+
			  '<div class="topRightSection">'+
				'<svg class="topSvg" ng-style="styles.topSvg">'+
				  '<g class="scaleGrp" transform="translate(10,25)"><g class="x axis"></g></g>'+
				'</svn>'+
			  '</div>'+
			  '<a class="SeqScrollArrow" ng-style="styles.scrollArrowRight" href="javascript:void(0);" title="Scroll Right">'+
				'<span ng-mouseup="stopMovingPan()" ng-mousemove="stopMovingPan()" ng-mousedown="movePan(-50)" class="icon-black" data-icon="&gt;"></span>'+
			  '</a>'+
			'</div>'+
			'<div class="bottomSection" ng-style="styles.bottomSection">'+
			  '<div class="bottomLeftSection" ng-style="styles.leftSecStyle">'+
				'<div ng-repeat="msgPdbId in pdbIdArr" '+
				'ng-style="{\'width\':\'100%\', \'text-align\':\'right\', \'margin-top\': $index == 0 ? printsMarginTop+\'px\' : \'6px\', \'height\': \'24px\', \'line-height\': \'24px\'}">'+
				  '<div class="leftPdbIdLabel">'+
					'<a href="//www.ebi.ac.uk/pdbe/entry/pdb/{{msgPdbId}}/" target="_blank" '+
					' title="For more information about key features of entry {{msgPdbId}}, click on the individual icons.">{{msgPdbId}}</a>'+
				  '</div>'+
				  '<div class="pdbprints_{{msgPdbId}}"></div>'+
				  '<div class="infoIconWarpper"> '+
					'<img ng-src="//www.ebi.ac.uk/pdbe/widgets/html/PinupIcons/Button-Details-icon.png" border="0" '+
					'ng-mousemove="showTooltip(infoIconMsg[msgPdbId], \'ng\', $event)" ng-mouseleave="hideTooltip()" ng-show="wrapperSize.width > 300" />'+
					'<a href="//www.ebi.ac.uk/pdbe-srv/view/files/{{msgPdbId}}.ent" '+
					'title="See the entry text file" target="_blank" style="margin-left:5px;">'+
					  '<img ng-src="//www.ebi.ac.uk/pdbe/widgets/html/PinupIcons/Button-Download-icon.png" border="0" />'+
					'</a>'+
				  '</div>'+
				'</div>'+
			  '</div>'+
			  '<div class="bottomRightSection">'+
				'<svg class="bottomSvg" ng-style="styles.bottomSvg" >'+
				  '<g class="shapesGrp" transform="translate(10,-21)">'+
					'<rect class="seqSvgBg" x="0" y="0" fill="none" stroke="none" ng-style="styles.bottomSvg" ></rect>'+
				  '</g>'+
				'</svg>'+
			  '</div>'+
			'</div>'+
		  '</div>');
}]);