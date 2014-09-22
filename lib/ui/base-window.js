/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var { assert } = require("../assertions");
var windows = require("../windows");

/**
 * Base window class
 * @constructor
 *
 * @param {MozMillController} aController
 *        Controller of the window
 */
function BaseWindow(aController) {
  assert.ok(aController, "A controller for the window has been specified");

  this._controller = aController;
  this._dtds = [];
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
   * Get list of required DTD locations
   *
   * @returns {string[]} Array of external DTD urls
   */
  get dtds() {
    return this._dtds;
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
