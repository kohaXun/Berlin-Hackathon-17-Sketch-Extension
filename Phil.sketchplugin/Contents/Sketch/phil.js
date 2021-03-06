var that = this;
function run (key, context) {
  that.context = context;

var exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports["default"] = function (context) {
    document = context.document;

    var sketch = context.api();
    var selection = context.selection;

    if (selection.count() == 0) {
        return sketch.alert("Select Artboard", "Select one artboard first!");
    } else if (selection.count() > 1) {
        return sketch.alert("Only one artboard allowed", "Please select only one artboard!");
    }

    // Make sure that every layer selected is an Artboard
    var isSelectionArtboard = selection.every(function (layer) {
        return layer.isMemberOfClass(MSArtboardGroup);
    });

    if (!isSelectionArtboard) {
        return sketch.alert("Select Artboard", "Select one artboard first!");
    }

    artboard = selection[0];

    findLabelsIn(artboard);
    createWindow();
};

var document;
var labelJSON = [];
var labels = [];
var artboard;
var startId = 0;

function findLabelsIn(layer) {
    // Determine the type of layer we're looking at
    switch (layer["class"]()) {

        // Text layer - this is the important one
        case MSTextLayer:

            if (!layer.isVisible()) {
                break;
            }

            var value = layer.stringValue().stringByReplacingOccurrencesOfString_withString("\u2028", "\n");
            var frame = layer.frame();
            var textTransform = layer.styleAttributes()["MSAttributedStringTextTransformAttribute"];
            if (textTransform === null) {
                textTransform = 0;
            }
            labelJSON.push({
                id: startId,
                content: value + "",
                position: {
                    x: Math.round(layer.absoluteRect().rulerX()),
                    y: Math.round(layer.absoluteRect().rulerY())
                },
                size: {
                    width: Math.round(frame.width()),
                    height: Math.round(frame.height())
                },
                font: {
                    color: "#" + layer.textColor().immutableModelObject().hexValue(),
                    size: layer.fontSize(),
                    family: layer.font().displayName() + "",
                    lineHeight: layer.paragraphStyle().minimumLineHeight(),
                    textAlignment: layer.textAlignment(),
                    letterSpacing: layer.kerning().toFixed(2),
                    textTransform: Math.round(textTransform)
                }
            });
            startId = startId + 1;
            layer.isVisible = false;
            labels.push(layer);
            break;

        // If we've started our search at the document root, loop through the pages
        case MSDocument:
            var documentPages = layer.pages();
            for (var i = 0; i < documentPages.length; i++) {
                var documentPage = documentPages[i];
                findLabelsIn(documentPage);
            }
            break;

        // Otherwise everything below that is an alias for layers anyway so we can treat them the same and loop through any sublayers
        case MSPage:
        case MSLayerGroup:
        case MSArtboardGroup:
            var sublayers = layer.layers();
            for (var i = 0; i < sublayers.length; i++) {
                var sublayer = sublayers[i];
                if (!sublayer.isVisible()) {
                    continue;
                }
                findLabelsIn(sublayer);
            }
            break;

        // case MSSymbolInstance:
        //
        //     log('in symbol');
        //     searchInSymbols(layer);
        //
        //   // log('not handling symbols right now');
        //     break;
    }
}

function createWindow() {
    // allow xml to be written in the folder
    var fileTypes = NSArray.arrayWithObject("xml");

    // create select folder window
    var panel = NSOpenPanel.openPanel();
    panel.setPrompt("Save");
    panel.setCanChooseDirectories(true);
    panel.setCanCreateDirectories(true);
    panel.setAllowsMultipleSelection(false);
    panel.setAllowedFileTypes(fileTypes);

    // create variable to check if clicked
    var clicked = panel.runModal();

    // check if clicked
    if (clicked == NSFileHandlingPanelOKButton) {
        var isDirectory = true;

        // get the folder path
        var firstURL = panel.URLs()[0];
        // format it to a string
        var file_path = NSString.stringWithFormat("%@", firstURL);

        // remove file:// path from string
        if (0 === file_path.indexOf("file://")) {
            file_path = file_path.substring(7);
        }

        exportJSON(file_path);
        exportPNG(file_path);

        var file = NSURL.fileURLWithPath(file_path + "index.html");
        NSWorkspace.sharedWorkspace().openFile(file.path());
    }

    for (i = 0; i < labels.length; i++) {
        var label = labels[i];
        label.isVisible = true;
    }
}

function exportPNG(toFilePath) {
    var slices = MSExportRequest.exportRequestsFromExportableLayer(artboard);
    var i, slice, filePath;
    for (i = 0; i < slices.length; i++) {
        slice = slices[i];
        filePath = toFilePath + "preview." + slice.format();
        slice.format();
        document.saveArtboardOrSlice_toFile(slice, filePath);
    }
}

function exportJSON(file_path) {
    // Create the JSON object from array
    var jsonObj = {
        "name": artboard.name() + "",
        "labels": labelJSON
    };

    //Convert the obj to a JSON string
    var file = NSString.stringWithString(JSON.stringify(jsonObj, null, "\t"));

    // Save the file
    file.writeToFile_atomically_encoding_error(file_path + 'labels' + ".json", true, NSUTF8StringEncoding, null);
}

/***/ })
/******/ ]);
  if (key === 'default' && typeof exports === 'function') {
    exports(context);
  } else {
    exports[key](context);
  }
}
that['onRun'] = run.bind(this, 'default')
