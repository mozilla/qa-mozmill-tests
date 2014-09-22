/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");

// Include required modules
var baseWindow = require("../../../lib/ui/base-window");
var utils = require("../../../lib/utils");
var windows = require("../../../lib/windows");

/**
 * Browser Window class
 *
 * @constructor
 * @param {MozMillController} [aController=mozmill.getBrowserController()]
 *        MozMillController of the Browser
 */
function BrowserWindow(aController) {
  this._controller = aController || mozmill.getBrowserController();
  this._dtds = ["chrome://branding/locale/brand.dtd",
                "chrome://browser/locale/browser.dtd",
                "chrome://browser/locale/aboutPrivateBrowsing.dtd"];
}

BrowserWindow.prototype = new baseWindow.BaseWindow(true);
BrowserWindow.prototype.constructor = BrowserWindow;

BrowserWindow.prototype.__defineGetter__('private', function() {
  return PrivateBrowsingUtils.isWindowPrivate(this._controller.window)
});

/**
 * Open a new Browser Window
 *
 * @param {string} aSpec
 *        Information about opening the new window
 * @param {string} [aSpec.method=menu]
 *        Method to use ("menu", "shortcut" or "callback")
 * @param {boolean} [aSpec.private=false]
 *        Value to check if a private window to open is needed
 * @param {function} [aCallback]
 *        The callback handler to use for opening the window
 *
 * @returns {BrowserWindow} A new instance of the BrowserWindow
 */
BrowserWindow.prototype.open = function BrowserWindow_open(aSpec, aCallback) {
  var spec = aSpec || {};
  var method = spec.method || "menu";
  var menuItem = "";
  var cmdKey = "";
  var shiftKey = false;

  if (spec.private) {
    menuItem = "#menu_newPrivateWindow";
    cmdKey = utils.getEntity(this.dtds, "privateBrowsingCmd.commandkey");
    shiftKey = true;
  }
  else {
    menuItem = "#menu_newNavigator";
    cmdKey = utils.getEntity(this.dtds, "newNavigatorCmd.key");
  }

  var controller = windows.waitForWindowState(() => {
    switch (method) {
      case "menu":
        this._controller.mainMenu.click(menuItem);
        break;
      case "shortcut":
        this._controller.keypress(null, cmdKey,
                                  {accelKey: true, shiftKey: shiftKey});
        break;
      case "callback":
        assert.equal(typeof aCallback, "function",
                     "Callback has been specified");
        aCallback(this._controller);
        break;
      default:
        assert.fail("Unknown opening method - " + method);
    }
  }, {state: "open", type: "navigator:browser"});

  var newWindow = new BrowserWindow(controller);

  if (spec.private) {
    assert.ok(newWindow.private, "A new private window has been opened");
    // Bug 847991
    // We need to wait for the about:privatebrowsing page to load,
    // otherwise it might load _after_ we try loading another page
    newWindow.controller.waitForPageLoad();
  }

  return newWindow;
}

// Export of methods
exports.BrowserWindow = BrowserWindow;
