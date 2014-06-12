/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var domUtils = require("../../../lib/dom-utils");
var utils = require("../../../lib/utils");
var windows = require("../../../lib/windows");

var baseWindow = require("../../../lib/ui/base-window");

/**
 * 'Places Organizer' window class (also called 'Library Window')
 *
 * @constructor
 * @param {MozMillController} aController
 *        MozMillController of the Library Window
 */
function PlacesOrganizerWindow(aController) {
  baseWindow.BaseWindow.call(this, aController);

  this._dtds = ["chrome://browser/locale/browser.dtd",
                "chrome://mozapps/locale/downloads/downloads.dtd",
                "chrome://browser/locale/places/places.dtd"];

  this._properties = ["chrome://browser/locale/places/places.properties",
                      "chrome://places/locale/places.properties"];

  this._tree = this.getElement({type: "tree"});
}

PlacesOrganizerWindow.prototype = Object.create(baseWindow.BaseWindow.prototype);
PlacesOrganizerWindow.prototype.constructor = PlacesOrganizerWindow;

/**
 * Get the main tree element from the Places Organizer window
 *
 * @returns {ElemBase} The tree element from window
 */
PlacesOrganizerWindow.prototype.__defineGetter__("tree", function () {
  return this._tree;
});

/**
 * Gets the download state of the given download
 *
 * @param {ElemBase} aDownload
 *        Download which state should be checked
 */
PlacesOrganizerWindow.prototype.getDownloadState = function POW_getDownloadState(aDownload) {
  assert.equal(typeof aDownload, "object", "Download has been specified");
  return aDownload.getAttribute("state");
};

/**
 * Retrieve list of UI elements based on the given specification
 *
 * @param {object} aSpec
 *        Information of the UI elements which should be retrieved
 * @parma {string} aSpec.type
 *        Identifier of the element
 * @param {string} [aSpec.subtype]
 *        Attribute of the element to filter
 * @param {string} [aSpec.value]
 *        Value of the attribute to filter
 * @param {string} [aSpec.parent=document]
 *        Parent of the to find element
 *
 * @returns {ElemBase[]} Elements which have been found
 */
PlacesOrganizerWindow.prototype.getElements = function POW_getElements(aSpec) {
  var spec = aSpec || {};

  var elems = null;
  var root = spec.parent || this.controller.window.document;

  var nodeCollector = new domUtils.nodeCollector(root);

  switch (spec.type) {
    case "backButton":
      elems = [findElement.ID(root, "back-button")];
      break;
    case "clearDownloads":
      elems = [findElement.ID(root, "clearDownloadsButton")];
      break;
    case "download":
      assert.ok(spec.value, "Download element index has been specified");
      elems = [findElement.ID(root, "downloadsItem_id:" + spec.value)];
      break;
    case "download_cancelButton":
      nodeCollector.root = this.getElement({type: "downloadItem", value: spec.value});
      nodeCollector.queryAnonymousNode("class", "downloadButton downloadCancel");
      elems = nodeCollector.elements;
      break;
    case "download_retryButton":
      nodeCollector.root = this.getElement({type: "downloadItem", value: spec.value});
      nodeCollector.queryAnonymousNode("class", "downloadButton downloadRetry");
      elems = nodeCollector.elements;
      break;
    case "download_showButton":
      nodeCollector.root = this.getElement({type: "downloadItem", value: spec.value});
      nodeCollector.queryAnonymousNode("class", "downloadButton downloadShow");
      elems = nodeCollector.elements;
      break;
    case "downloadItem":
      nodeCollector.root = this.getElement({type: "downloadList"});
      nodeCollector.queryNodes("class", "download download-state")
                   .filterByDOMProperty("displayName", spec.value);
      elems = nodeCollector.elements;
      break;
    case "downloadList":
      elems = [findElement.ID(root, "downloadsRichListBox")];
      break;
    case "forwardButton":
      elems = [findElement.ID(root, "forward-button")];
      break;
    case "maintenanceButton":
      elems = [findElement.ID(root, "maintenanceButton")];
      break;
    case "organizeButton":
      elems = [findElement.ID(root, "organizeButton")];
      break;
    case "searchFilter":
      elems = [findElement.ID(root, "searchFilter")];
      break;
    case "tree":
      elems = [findElement.ID(root, "placesList")];
      break;
    case "viewMenu":
      elems = [findElement.ID(root, "viewMenu")];
      break;
    default:
      assert.fail("Unknown element type - " + spec.type);
  }
  return elems;
};

/**
 * Close the Places Organizer window
 *
 * @param {object} [aSpec={}]
 *        Information about closing the window
 * @param {string} [aSpec.method="shortcut"]
 *        Method to use for closing ("callback" or "shortcut")
 * @param {function} [aSpec.callback]
 *        Callback that triggers the places organized window to close
 * @param {boolean} [aSpec.force=false]
 *        Force closing the window
 */
PlacesOrganizerWindow.prototype.close = function POW_close(aSpec={}) {
  var method = aSpec.method || "shortcut";
  var callback = null;

  if (aSpec.force) {
    baseWindow.BaseWindow.prototype.close.call(this);
    return;
  }

  switch (method) {
    case "callback":
      assert.equal(typeof aSpec.callback, "function",
                   "Callback has been defined");
      callback = aSpec.callback();
      break;
    case "shortcut":
       var closeWindowKey = this.getEntity("closeCmd.key");
       callback = () => {
         this.controller.keypress(null, closeWindowKey, {accelKey: true});
       }
      break;
    default:
      assert.fail("Unknown method to close the window - " + method);
  }

  baseWindow.BaseWindow.prototype.close.call(this, callback);
}

/**
 * Open the places organizer window
 *
 * @param {function} aCallback
 *        Callback that opens the Place:Organizer Window
 *
 * @returns {PlacesOrganizerWindow} New instance of PlacesOrganizerWindow
 */
function open(aCallback) {
  assert.equal(typeof aCallback, "function",
               "Callback has been defined");

  var controller = windows.waitForWindowState(() => {
    aCallback();
  }, {state: "open", type: "Places:Organizer"});

  return new PlacesOrganizerWindow(controller);
}

// Export of classes
exports.PlacesOrganizerWindow = PlacesOrganizerWindow;

// Export of methods
exports.open = open;

