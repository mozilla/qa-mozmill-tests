/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var { assert } = require("../../lib/assertions");
var domUtils = require("../../lib/dom-utils");

/**
 * Handler for the autofill popup (context menu) used in metro firefox
 *
 * @constructor
 * @param {MozMillController} aController
 *        Controller of the window
 */
function AutoFillPopup(aController) {
  this._controller = aController;
}

AutoFillPopup.prototype = {
  /**
   * Returns the controller of the class instance
   *
   * @returns {MozMillController} Controller of the window
   */
  get controller() {
    return this._controller;
  },

   /**
   * Retrieve an UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   * @param {object} aSpec.type
   *        Identifier of the element
   * @param {object} [aSpec.subtype=""]
   *        Attribute of the element to filter
   * @param {object} [aSpec.value=""]
   *        Value of the attribute to filter
   * @param {object} [aSpec.parent=document]
   *        Parent of the to find element
   *
   * @returns {Object} Element which has been found
   */
  getElement : function autoFillPopup_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {Object} aSpec
   *        Information of the UI elements which should be retrieved
   * @param {Object} aSpec.type=""
   *        General type information
   * @param {Object} [aSpec.subtype]
   *        Specific element or property
   * @param {Object} [aSpec.value=0]
   *        Value of the element or property
   * @param {object} [aSpec.parent=document]
   *        Parent of the to find element
   *
   * @returns {Object[]} Array of elements which have been found
   */
  getElements : function autoFillPopup_getElements(aSpec) {
    var elem = null;
    var spec = aSpec || {};

    var root = spec.parent ? spec.parent.getNode() : this._controller.window.document;
    var nodeCollector = new domUtils.nodeCollector(root);

    switch(spec.type) {
      case "container":
        elem = new elementslib.ID(this._controller.window.document, "autofill-container");
        return [elem];
      case "popup":
        nodeCollector.root = this.getElement({type: "container"}).getNode();
        nodeCollector.queryNodes("#autofill-popup");
        break;
      case "results":
        nodeCollector.root = this.getElement({type: "popup"}).getNode();
        nodeCollector.queryNodes("richlistitem");
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return nodeCollector.elements;
  },

  /**
   * Check if the Auto Fill Popup is open
   *
   * @returns {Boolean} True if the Auto Fill Popup is open, false otherwise
   */
  isOpen : function autoFillPopup_isOpen() {
    var popupContainer = this.getElement({type: "container"});
    return !popupContainer.getNode().hidden;
  },

  /**
   * Open the autofill popup
   *
   * @params {function} aCallbackOpen
   *         Function that triggers the popup to open
   */
  open : function autoFillPopup_waitForOpen(aCallbackOpen) {
    var popupContainer = this.getElement({type: "container"});
    if(!this.isOpen()) {
      this._openClosePopupEvents(aCallbackOpen, "Autofill popoup has been opened");
    }
    else {
      assert.fail("Popup already opened");
    }
  },

  /**
   * Close the autofill popup
   *
   * @params {function} aCallbackClose
   *         Function that triggers the popup to open
   */
  close : function autoFillPopup_waitForClose(aCallbackClose) {
    if (this.isOpen()) {
      this._openClosePopupEvents(aCallbackClose, "Autofill popoup has been closed");
    }
    else {
      assert.fail("Popup already closed");
    }
  },

  /**
   * Trigger open/close events and wait for them to finish
   *
   * @params {function} aCallback
   *         Function that triggers the popup to open/close
   * @params {String} aMessage
   *         Message for event ending
   */
  _openClosePopupEvents : function autoFillPopup_openClosePopupEvents(aCallback, aMessage) {
    // Wait for the autofill popup to open/close
    var transitionend = false;
    function onTransitionEnd() {
      transitionend = true;
    }

    // Select the popup window
    var popAutoFillContainer = this.getElement({type: "container"});
    popAutoFillContainer.getNode().addEventListener("transitionend", onTransitionEnd);

    try {
      aCallback();
      assert.waitFor(() => transitionend, aMessage);
    }
    finally {
      popAutoFillContainer.getNode().removeEventListener("transitionend", onTransitionEnd);
    }
  }
}

// Exports of classes
exports.AutoFillPopup = AutoFillPopup;
