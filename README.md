# PDB UniProt Viewer

[![NPM version](http://img.shields.io/npm/v/pdb-uniprot-viewer.svg)](https://www.npmjs.org/package/pdb-uniprot-viewer) 

The PDB UniProt viewer displays a summary of PDB entries contains a sequence mapped to a particular UniProt code. The mapping indicates what coverage of a UnipProt accession is available in the PDB archive. Graphics also indicate whether the sequence in a given PDB entry differs from that in UniProt (for instance, it contains engineered mutations or expression tags).

It is a <a href="http://www.ebi.ac.uk/pdbe/pdb-component-library" target="_blank">PDB Component Library</a> component.

![PDB UniProt Viewer](/assets/pdb-uniprot-viewer.png)

## Getting Started
It takes only 3 easy steps to get started with PDB Components.

* Include module files and required dependencies
* Install the component
* Use component as custom element anywhere in the page

>*If you have installed the <a href="http://www.ebi.ac.uk/pdbe/pdb-component-library" target="_blank">PDB Component Library</a> in your application then you can directly start using the component as custom element (refer step 3).*

#### **1.** Include module files and dependencies
Download the module javascript and stylesheet files (pdb.uniprot.viewer.min.js and pdb.uniprot.viewer.min.css) stored in the 'build' folder. Include the files in your page &lt;head&gt; section.

You'll also need to include the D3.js, AngularJS library files and pdb-prints component files (please refer *'bower.json'* file for complete dependency details).
```html
<!-- D3.js and AngularJs dependency scripts (these can be skipped if already included in page) -->
<script src="bower_components/d3/d3.min.js"></script>
<script src="bower_components/angular/angular.min.js"></script>

<!-- PDB Prints CSS and script -->
<link rel="stylesheet" href="bower_components/pdb-prints/build/pdb.prints.min.css" />
<script src="bower_components/pdb-prints/build/pdb.prints.min.js"></script>

<!-- minified component CSS and script -->
<link rel="stylesheet" href="build/pdb.uniprot.viewer.min.css" />
<script src="build/pdb.uniprot.viewer.min.js"></script>
```

#### **2.** Installation
As soon as you've got the dependencies and library files included in your application page you just need to include following installation script :

***I)*** If you are developing an AngularJs Application

```html
<script>
angular.module('myModule', ['pdb.uniprot.viewer']);
</script>
```

***II)*** For other Applications

```html
<script>
(function () {
  'use strict';
  angular.element(document).ready(function () {
      angular.bootstrap(document, ['pdb.uniprot.viewer']);
  });
}());
</script>
```

#### **3.** Using component as custom element anywhere in the page

The component can be used as custom element, attribute or class anywhere in the page.

```html
<!-- component as custom element -->
<pdb-uniprot-viewer entry-id="P07550" height="370" width="750"></pdb-uniprot-viewer>

<!-- component as attribute -->
<div pdb-uniprot-viewer entry-id="P07550" height="370" width="750"></div>

<!-- component as class -->
<div class="pdb-uniprot-viewer" entry-id="P07550" height="370" width="750"></div>

```
## Documentation

### Attributes
| Sr. No.        | Attribute           | Values  | Description |
|:-------------:|:-------------|:-----|:-----|
| 1      | entry-id | _UniProt ID_ <br>**Mandatory attribute!**  | Example : entry-id="P07550" |
| 2      | hide-pdb-prints |_Boolean (true/false)_ <br>*(Optional Attribute)*<br>Default : 'false' |Removes the PDB Prints component from the viewer.<br>Example : hide-pdb-prints="true"  |
| 3      | height | _Number_ <br>*(Optional Attribute)* |Example : height="370"  |
| 4      | width | _Number_ <br>*(Optional Attribute)* |Example : width="750"  |
| 5      | subscribe-events | _Boolean (true/false)_ <br>*(Optional Attribute)*<br>Default : 'true' |Subscribes to custom events of other PDB Components.<br>Example : subscribe-events="true"  |

### Custom Events
Use this to subscript/bind events of this component. Event data (available in key = 'eventData') contains information about the residue number, chain, entry and entity, etc.

| Sr. No.        | Event | Description |
|:-------------:|:-------------|:-----|
| 1 | PDB.uniprotViewer.click | use this to bind to click event<br> Example:<br> document.addEventListener('PDB.uniprotViewer.click', function(e){ /\/do something on event }) |
| 2 | PDB.uniprotViewer.mouseover | use this to bind to mouseover event<br> Example:<br> document.addEventListener('PDB.uniprotViewer.mouseover', function(e){ /\/do something on event }) |
| 3 | PDB.uniprotViewer.mouseout | use this to bind to mouseout event<br> Example:<br> document.addEventListener('PDB.uniprotViewer.mouseout', function(e){ /\/do something on event }) |

*Please refer <a href="http://www.ebi.ac.uk/pdbe/pdb-component-library/doc.html#a_uniPDBViewer" target="_blank">this link</a> for more documentation, demo and parameters details.*

## Contact
Please <a href="https://github.com/mandarsd/pdb-uniprot-viewer">use github</a> to report **bugs**, discuss potential **new features** or **ask questions** in general. Also you can <a href="http://www.ebi.ac.uk/pdbe/about/contact" target="_blank">contact us here</a> for support, feedback or to report any issues.

## License
The plugin is released under the Apache License Version 2.0. You can find out more about it at http://www.apache.org/licenses/LICENSE-2.0 or within the license file of the repository.

## If you are interested in this plugin...
...you might also want to have a look at the <a href="http://www.ebi.ac.uk/pdbe/pdb-component-library" target="_blank">PDB Component Library</a>.


"# pdb-uniprot-viewer" 
