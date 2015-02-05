/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var { assert } = require("../assertions");
var utils = require("../utils");
var windows = require("../windows");

/**
 * Base window class
 * @constructor
 *
 * @param {MozMillController} aController
 *        Controller of the window
 *        'null' value is accepted for cases we instantiate the controller later
 *        in a method of the class (e.g.: in the open method)
 */
function BaseWindow(aController) {
  assert.notEqual(typeof aController, "undefined",
                  "A controller for the window has been specified");

  this._controller = aController;
  this._dtds = [];
  this._properties = [];
}

BaseWindow.prototype = {
  /**
   * Returns the controller of the current window
   *
   * @returns {MozMillController} Controller of the window
   */
  get controller() {
    return this._controller;
  },

  /**
   * Checks if the BaseWindow is closed
   *
   * @returns {boolean} True if the window is closed, false otherwise.
   */
  get closed() {
    return this._controller.window.closed;
  },

  /**
   * Close this window
   *
   * @param {function} [aCallback]
   *        Define new function that closes the window
   */
  close: function BaseWindow_close(aCallback) {
    var callback = (typeof aCallback === "function") ? aCallback :
                   () => { this._controller.window.close(); }

    windows.waitForWindowState(callback, {state: windows.WINDOW_STATES.closed,
                                          window: this._controller.window});
  },

  /**
   * Retrieve an UI element based on the given specification
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
   *        Parent of the element
   *
   * @returns {ElemBase} Element which has been found
   */
  getElement: function BaseWindow_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

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
  getElements: function BaseWindow_getElements(aSpec={}) {
    return [];
  },

  /**
   * Get the value of a DTD entity of the current window
   *
   * @param {String} aName
   *        Entity name
   *
   * @returns {String} The value of the requested entity
   */
  getEntity: function BaseWindow_getEntity(aName) {
    return utils.getEntity(this._dtds, aName);
  },

  /**
   * Get the value of a property of the current window
   *
   * @param {String} aID
   *        Property id
   *
   * @returns {String} The value of the requested property
   */
  getProperty: function BaseWindow_getProperty(aID) {
    return utils.getProperty(this._properties, aID);
  },

  /**
   * Maximizes the current window
   */
  maximize: function BaseWindow_maximize() {
    this.controller.window.maximize();
  },

  /**
   * Restores the window size after it has been maximized
   */
  restore: function BaseWindow_restore() {
    this.controller.window.restore();
  },

  /**
   * Open a new Base Window
   *
   * @returns {BaseWindow} Instance of the BaseWindow
   */
  open: function BaseWindow_open() {
    var window = this._controller.window.open();
    window = mozmill.utils.getChromeWindow(window);
    var controller = new mozmill.controller.MozMillController(window);
    return new BaseWindow(controller);
  }
}

// Export of classes
exports.BaseWindow = BaseWindow;
