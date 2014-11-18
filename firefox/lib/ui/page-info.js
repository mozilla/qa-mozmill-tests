/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var domUtils = require("../../../lib/dom-utils");
var utils = require("../../../lib/utils");
var windows = require("../../../lib/windows");

var baseWindow = require("../../../lib/ui/base-window");

/**
 * 'PageInfo' Window  class
 *
 * @constructor
 * @param {MozMillController} aController
 *        Controller of the page info window
 */
function PageInfoWindow(aController) {
  baseWindow.BaseWindow.call(this, aController);

  this._dtds = ["chrome://browser/locale/pageInfo.dtd"];
  this._properties = ["chrome://browser/locale/pageInfo.properties"];
}

PageInfoWindow.prototype = Object.create(baseWindow.BaseWindow.prototype);
PageInfoWindow.constructor = PageInfoWindow;

/**
 * Get the selected category
 *
 * @returns {string} The selected category
 */
PageInfoWindow.prototype.__defineGetter__("category", function () {
  var panel = this.getElement({type: "panelsContainer"});
  return panel.getNode().selectedPanel.id.split("Panel")[0];
});

/**
 * Set the selected category
 *
 * @param {string} aCategory
 *        Category tab to click on
 */
PageInfoWindow.prototype.__defineSetter__("category", function (aCategory) {
  assert.equal(typeof aCategory, "string", "tab has been defined");
  var category = this.getElement({type:  "category", subtype: aCategory});

  // Return early if category is already selected
  if (this.category === aCategory) {
    return;
  }

  var selectFlag = false;
  var onSelect = function () { selectFlag = true; };

  this.controller.window.addEventListener("select", onSelect);

  try {
    category.waitThenClick();
    assert.waitFor(() => selectFlag, "Select event has been fired");
  }
  finally {
    this.controller.window.removeEventListener("select", onSelect);
  }

  assert.waitFor(() => (this.category === aCategory),
                 "Category '" + aCategory + "' has been selected");
});

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
PageInfoWindow.prototype.getElements = function PIW_getElements(aSpec={}) {
  var root = aSpec.parent || this.controller.window.document;
  var elems = null;

  switch (aSpec.type) {
    case "panelsContainer":
      elems = [findElement.ID(root, "mainDeck")];
      break;
    case "categories":
      var viewGroup = findElement.ID(root, "viewGroup");
      var nodeCollector = new domUtils.nodeCollector(viewGroup.getNode());
      nodeCollector.queryNodes("radio").filterByJSProperty("hidden", false);
      elems = nodeCollector.elements;
      break;
    case "category":
      elems = [findElement.ID(root, aSpec.subtype + "Tab")];
      break;
    case "panel":
      elems = [findElement.ID(root, aSpec.subtype + "Panel")];
      break;
    case "security":
      switch (aSpec.subtype) {
        case "domain":
        case "owner":
        case "verifier":
          elems = [findElement.ID(root, "security-identity-" + aSpec.subtype + "-value")];
          break;
        case "cert":
        case "cookies":
        case "password":
          elems = [findElement.ID(root, "security-view-" + aSpec.subtype)];
          break;
      }
      break;
    default:
      assert.fail("Unknown element type - " + aSpec.type);
  }

  return elems;
};

/**
 * Open the page info window
 *
 * @param {function} aCallback
 *        Callback that triggers the opening
 *
 * @returns {PageInfoWindow} New instance of the PageInfoWindow class
 */
function open(aCallback) {
  assert.equal(typeof aCallback, "function",
               "Callback has been defined");

  var controller = windows.waitForWindowState(() => {
    aCallback();
  }, {state: "open", type: "Browser:page-info", observer: "page-info-dialog-loaded"});

  return new PageInfoWindow(controller);
};

// Export classes
exports.pageInfoWindow = PageInfoWindow;

// Export methods
exports.open = open;
