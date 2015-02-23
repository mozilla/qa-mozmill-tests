/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var baseWindow = require("../../../lib/ui/base-window");
var domUtils = require("../../../lib/dom-utils");
var windows = require("../../../lib/windows");

/**
 * Save file of unknown type window class
 *
 * @constructor
 * @param {MozMillController} [aController]
 *        MozMillController of the SaveFile Window
 */
function UnknownContentTypeDialog(aController) {
  baseWindow.BaseWindow.call(this, aController);

  this._dtds = ["chrome://branding/locale/brand.dtd",
                "chrome://mozapps/locale/downloads/unknownContentType.dtd",
                "chrome://mozapps/locale/downloads/settingsChange.dtd"];

  this._properties = ["chrome://mozapps/locale/downloads/unknownContentType.properties"];
}

UnknownContentTypeDialog.prototype = Object.create(baseWindow.BaseWindow.prototype);
UnknownContentTypeDialog.prototype.constructor = UnknownContentTypeDialog;

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
UnknownContentTypeDialog.prototype.getElements = function UCTD_getElements(aSpec={}) {
  var elems = [];
  var root = aSpec.parent ? aSpec.parent.getNode()
                          : this._controller.window.document;
  var nodeCollector = new domUtils.nodeCollector(root.documentElement);

  switch (aSpec.type) {
    case "button":
      assert.ok(aSpec.subtype, "Button name has been specified");

      nodeCollector.queryAnonymousNode("anonid", "buttons");
      nodeCollector.root = nodeCollector.nodes[0];
      nodeCollector.queryNodes("[dlgtype=" + aSpec.subtype +"]");
      elems = nodeCollector.elements;
      break;
    case "save":
      elems = [findElement.ID(root, "save")];
      break;
    case "remember":
      elems = [findElement.ID(root, "rememberChoice")];
      break;
    default:
      assert.fail("Unknown element type - " + aSpec.type);
  }

  return elems;
}

/**
 * Download the file of unknown type from current open UCTD by
 * saving it automatically to disk
 */
UnknownContentTypeDialog.prototype.save = function UCTD_save() {
  var saveFileRadio = this.getElement({type: "save"});

  assert.waitFor(() => !!saveFileRadio.getNode(),
                 "Save File radio button has been enabled");

  saveFileRadio.click();
  assert.ok(saveFileRadio.getNode().selected,
            "Save File radio button has been selected");

  // Wait until the OK button has been enabled and click on it
  var acceptButton = this.getElement({type: "button", subtype: "accept"});
  assert.waitFor(() => (acceptButton.exists() &&
                        !acceptButton.getNode().hasAttribute("disabled")),
                        "The OK button has been enabled");
  this.close(() => { acceptButton.click(); });
}

/**
 * Helper for opening the Unknown Content Type dialog
 *
 * @param {function} aCallback
 *        Callback that opens the unknownContentType dialog
 *
 * @returns {UnknownContentTypeDialog} New instance of UnknownContentTypeDialog
 */
function open(aCallback) {
  assert.equal(typeof aCallback, "function", "Callback has been specified");

  var controller = windows.waitForWindowState(() => {
    aCallback();
  }, {id: "unknownContentType", state: "open"});

  return new UnknownContentTypeDialog(controller);
}

// Export of classes
exports.UnknownContentTypeDialog = UnknownContentTypeDialog;

// Export of methods
exports.open = open;

