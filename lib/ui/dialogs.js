/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
var windows = require("../windows");
var domUtils = require("../dom-utils");

var baseWindow = require("base-window");

/**
 * Base Dialog class
 * https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XUL/dialog
 *
 * @constructor
 * @param {MozMillController} [aController=mozmill.getBrowserController()]
 *        MozMillController of the Browser
 */
function CommonDialog(aController) {
  baseWindow.BaseWindow.call(this, aController);
}

CommonDialog.prototype = Object.create(baseWindow.BaseWindow.prototype);
CommonDialog.prototype.constructor = CommonDialog;

/**
 * Get the title of the dialog
 *
 * @returns {string} Title of the dialog
 */
CommonDialog.prototype.__defineGetter__('title', function () {
  return this.controller.window.document.title ||
         this.getElement({type: "info_title"}).getNode().textContent;
});

/**
 * Helper method which clicks on accept button
 */
CommonDialog.prototype.accept = function CommonDialog_accept() {
  var button = this.getElement({type: "button_accept"});
  button.click();
};

/**
 * Helper method which clicks on cancel button
 */
CommonDialog.prototype.cancel = function CommonDialog_cancel() {
  var button = this.getElement({type: "button_cancel"});
  button.click();
};

/**
 * Retrieve list of UI elements based on the given specification
 *
 * @param {object} aSpec
 *        Information of the UI elements which should be retrieved
 * @parma {string} aSpec.type
 *        Identifier of the elements
 * @param {string} [aSpec.subtype]
 *        Attribute of the elements to filter
 * @param {string} [aSpec.value]
 *        Value of the attribute to filter
 * @param {string} [aSpec.parent=document]
 *        Parent of the to find element
 *
 * @returns {ElemBase[]} Elements which have been found
 */
CommonDialog.prototype.getElements = function CommonDialog_getElements(aSpec={}) {
  var elems = [];
  var root = aSpec.parent ? aSpec.parent.getNode()
                          : this._controller.window.document;
  var nodeCollector = new domUtils.nodeCollector(root.documentElement);

  switch (aSpec.type) {
    case "button_accept":
      nodeCollector.queryAnonymousNode("dlgtype", "accept");
      elems = nodeCollector.elements;
      break;
    case "button_cancel":
      nodeCollector.queryAnonymousNode("dlgtype", "cancel");
      elems = nodeCollector.elements;
      break;
    case "button_disclosure":
      nodeCollector.queryAnonymousNode("dlgtype", "disclosure");
      elems = nodeCollector.elements;
      break;
    case "button_extra1":
      nodeCollector.queryAnonymousNode("dlgtype", "extra1");
      elems = nodeCollector.elements;
      break;
    case "button_extra2":
      nodeCollector.queryAnonymousNode("dlgtype", "extra2");
      elems = nodeCollector.elements;
      break;
    case "button_help":
      nodeCollector.queryAnonymousNode("dlgtype", "help");
      elems = nodeCollector.elements;
      break;
    case "checkbox":
      elems = [findElement.ID(root, "checkbox")];
      break;
    case "info_body":
      elems = [findElement.ID(root, "info.body")];
      break;
    case "info_icon":
      elems = [findElement.ID(root, "info.icon")];
      break;
    case "info_title":
      elems = [findElement.ID(root, "info.title")];
      break;
    case "login_label":
      elems = [findElement.ID(root, "loginLabel")];
      break;
    case "login_textbox":
      elems = [findElement.ID(root, "loginTextbox")];
      break;
    case "password_label":
      elems = [findElement.ID(root, "password1Label")];
      break;
    case "password_textbox":
      elems = [findElement.ID(root, "password1Textbox")];
      break;
    default:
      assert.fail("Unknown element type - " + aSpec.type);
  }

  return elems;
};


/**
 * Search engine adding confirmation class
 *
 * @constructor
 * @param {MozMillController} [aController=mozmill.getBrowserController()]
 *        MozMillController of the Browser
 */
function AddEngineConfirmDialog(aController) {
  CommonDialog.call(this, aController);
  this._properties = ["chrome://global/locale/search/search.properties"];
}

AddEngineConfirmDialog.prototype = Object.create(CommonDialog.prototype);
AddEngineConfirmDialog.prototype.constructor = AddEngineConfirmDialog;

/**
 * Helper for opening the dialog
 *
 * @param {function} aCallback
 *        Callback that opens the dialog
 *
 * @returns {CommonDialog} New instance of CommonDialog
 */
function open(aCallback) {
  assert.equal(typeof aCallback, "function", "Callback has been specified");
  var controller = windows.waitForWindowState(() => {
    aCallback();
  }, {id: "commonDialog", state: "open"});

  return new CommonDialog(controller);
}

// Export of classes
exports.AddEngineConfirmDialog = AddEngineConfirmDialog;
exports.CommonDialog = CommonDialog;

// Export of methods
exports.open = open;
