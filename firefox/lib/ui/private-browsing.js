/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The PrivateBrowsingAPI adds support for handling the private browsing window.
 *
 * @version 2.0.0
 */

var observerService = Cc["@mozilla.org/observer-service;1"].
                      getService(Ci.nsIObserverService);

// Include required modules
var { assert } = require("../../../lib/assertions");
var utils = require("../utils");

// Import PrivateBrowsingUtils to gain acces to its API
Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");

/**
 * Create a new PrivateBrowsingWindow instance.
 *
 * @class This class adds support for the Private Browsing Window
 * @param {MozMillController} aController
 *        MozMillController to use for the modal entry dialog
 */
function PrivateBrowsingWindow(aController) {
  this._controller = aController || null;
}

/**
 * Prototype definition of the PrivateBrowsingWindow class
 */
PrivateBrowsingWindow.prototype = {
  /**
   * Returns the controller of the class instance
   *
   * @returns {MozMillController} Controller of the window
   */
  get controller() {
    return this._controller;
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function PBW_getDtds() {
    var dtds = ["chrome://branding/locale/brand.dtd",
                "chrome://browser/locale/browser.dtd",
                "chrome://browser/locale/aboutPrivateBrowsing.dtd"];
    return dtds;
  },

  /**
   * Returns the private browsing state of the window of the class instance
   *
   * @returns {boolean} Private state of the window
   */
  isPrivate : function PBW_isPrivate() {
    return isPrivateBrowsingWindow(this._controller);
  },

  /**
   * Open a Private Browsing window
   *
   * @param {MozMillController} aController
            Controller of the window
   * @param {string} aMethod
   *        Specifies a method for opening the private browsing window
   * @param {function} [aCallback]
   *        The callback handler to use for opening the private browsing window
   */
  open: function PBW_open(aController, aMethod, aCallback) {
    var method = aMethod || "menu";
    var windowCount = mozmill.utils.getWindows("navigator:browser").length;

    assert.ok(aController, "A controller has to be specified");

    switch (method) {
      case "menu":
        aController.mainMenu.click("#menu_newPrivateWindow");
        break;
      case "shortcut":
        var cmdKey = utils.getEntity(this.getDtds(), "privateBrowsingCmd.commandkey");
        aController.keypress(null, cmdKey, {accelKey: true, shiftKey: true});
        break;
      case "callback":
        assert.equal(typeof aCallback, "function",
                     "Callback for opening the private browsing window has been specified");
        aCallback(aController);
        break;
      default:
        assert.fail("Unknown opening method - " + method);
    }

    assert.waitFor(function () {
      var windows = mozmill.utils.getWindows("navigator:browser");

      return (windows.length === (windowCount + 1));
    }, "A new window has been opened");

    this._controller = utils.handleWindow("type", "navigator:browser", undefined, false);

    // Bug 847991
    // We need to wait for the about:privatebrowsing page to load,
    // otherwise it might load _after_ we try loading another page
    this._controller.waitForPageLoad();

    assert.ok(this.isPrivate(), "A new private window has been opened");
  },

  /**
   * Close the Private Browsing window
   * @param {boolean} aIgnoreFailures
   *        Boolean value that sets the function to ignore failures if true
   *        or throw an Error if false
   *
   */
  close: function PBW_close(aIgnoreFailures) {
    const DOM_WINDOW_DESTROYED_TOPIC = "dom-window-destroyed";

    var windowClosed = false;
    var observer = {
      observe: function(aSubject, aTopic, aData) {
        windowClosed = true;
      }
    }

    // Try to close the window in case it is not already closed
    try {
      observerService.addObserver(observer, DOM_WINDOW_DESTROYED_TOPIC, false);

      this._controller.window.close();

      // Wait for it to be finished
      assert.waitFor(function () {
        return windowClosed;
      }, "A private browsing window has been closed");
    }
    catch (ex) {
      if (!aIgnoreFailures) {
        assert.fail("Private Browsing Window has been closed.");
      }
    }
    finally {
      observerService.removeObserver(observer, DOM_WINDOW_DESTROYED_TOPIC);
      this._controller = null;
    }
  }
}

/**
 * Checks a window for being a Private Window.
 *
 * @param {MozMillController} aController
 *        Controller of the window to check
 *
 * @returns {boolean} True if the window is a private browsing window
 */
function isPrivateBrowsingWindow(aController) {
  assert.ok(aController, arguments.callee.name + ": A controller has been specified");

  return PrivateBrowsingUtils.isWindowPrivate(aController.window);
}

// Export of classes
exports.PrivateBrowsingWindow = PrivateBrowsingWindow;

// Export of functions
exports.isPrivateBrowsingWindow = isPrivateBrowsingWindow;
