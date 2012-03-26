/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The PrivateBrowsingAPI adds support for handling the private browsing mode.
 *
 * @version 1.0.0
 */

// Include required modules
var modalDialog = require("modal-dialog");
var prefs = require("prefs");
var utils = require("utils");

// Preference for confirmation dialog when entering Private Browsing mode
const PB_NO_PROMPT_PREF = 'browser.privatebrowsing.dont_prompt_on_enter';

const gTimeout = 5000;

/**
 * Create a new privateBrowsing instance.
 *
 * @class This class adds support for the Private Browsing mode
 * @param {MozMillController} controller
 *        MozMillController to use for the modal entry dialog
 */
function privateBrowsing(controller) {
  this._controller = controller;
  this._handler = null;

  /**
   * Menu item in the main menu to enter/leave Private Browsing mode
   * @private
   */
  this._pbMenuItem = new elementslib.Elem(this._controller.menus['tools-menu'].privateBrowsingItem);
  this._pbTransitionItem = new elementslib.ID(this._controller.window.document, "Tools:PrivateBrowsing");

  this.__defineGetter__('_pbs', function() {
    delete this._pbs;
    return this._pbs = Cc["@mozilla.org/privatebrowsing;1"].
                       getService(Ci.nsIPrivateBrowsingService);
  });
}

/**
 * Prototype definition of the privateBrowsing class
 */
privateBrowsing.prototype = {
  /**
   * Returns the controller of the current window
   *
   * @returns Mozmill Controller
   * @type {MozMillController}
   */
  get controller() {
    return this._controller;
  },

  /**
   * Checks the state of the Private Browsing mode
   *
   * @returns Enabled state
   * @type {boolean}
   */
  get enabled() {
    return this._pbs.privateBrowsingEnabled;
  },

  /**
   * Sets the state of the Private Browsing mode
   *
   * @param {boolean} value
   *        New state of the Private Browsing mode
   */
  set enabled(value) {
    this._pbs.privateBrowsingEnabled = value;
  },

  /**
   * Sets the callback handler for the confirmation dialog
   *
   * @param {function} callback
   *        Callback handler for the confirmation dialog
   */
  set handler(callback) {
    this._handler = callback;
  },

  /**
   * Gets the enabled state of the confirmation dialog
   *
   * @returns Enabled state
   * @type {boolean}
   */
  get showPrompt() {
    return !prefs.preferences.getPref(PB_NO_PROMPT_PREF, true);
  },

  /**
   * Sets the enabled state of the confirmation dialog
   *
   * @param {boolean} value
   *        New enabled state of the confirmation dialog
   */
  set showPrompt(value){
    prefs.preferences.setPref(PB_NO_PROMPT_PREF, !value);
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function downloadManager_getDtds() {
    var dtds = ["chrome://branding/locale/brand.dtd",
                "chrome://browser/locale/browser.dtd",
                "chrome://browser/locale/aboutPrivateBrowsing.dtd"];
    return dtds;
  },

  /**
   * Turn off Private Browsing mode and reset all changes
   */
  reset : function privateBrowsing_reset() {
    try {
      this.stop(true);
    } catch (ex) {
      // Do a hard reset
      this.enabled = false;
    }

    this.showPrompt = true;
  },

  /**
   * Start the Private Browsing mode
   *
   * @param {boolean} useShortcut
   *        Use the keyboard shortcut if true otherwise the menu entry is used
   */
  start: function privateBrowsing_start(useShortcut) {
    var dialog = null;

    if (this.enabled)
      return;

    if (this.showPrompt) {
      dialog = new modalDialog.modalDialog(this._controller.window);
      dialog.start(this._handler);
    }

    if (useShortcut) {
      var cmdKey = utils.getEntity(this.getDtds(), "privateBrowsingCmd.commandkey");
      this._controller.keypress(null, cmdKey, {accelKey: true, shiftKey: true});
    } else {
      this._controller.click(this._pbMenuItem);
    }

    if (dialog) {
      dialog.waitForDialog();
    }
    this.waitForTransistionComplete(true);
  },

  /**
   * Stop the Private Browsing mode
   *
   * @param {boolean} useShortcut
   *        Use the keyboard shortcut if true otherwise the menu entry is used
   */
  stop: function privateBrowsing_stop(useShortcut)
  {
    if (!this.enabled)
      return;

    if (useShortcut) {
      var privateBrowsingCmdKey = utils.getEntity(this.getDtds(), "privateBrowsingCmd.commandkey");
      this._controller.keypress(null, privateBrowsingCmdKey, {accelKey: true, shiftKey: true});
    } else {
      this._controller.click(this._pbMenuItem);
    }

    this.waitForTransistionComplete(false);
  },

  /**
   * Waits until the transistion into or out of the Private Browsing mode happened
   *
   * @param {boolean} state
   *        Expected target state of the Private Browsing mode
   */
  waitForTransistionComplete : function privateBrowsing_waitForTransitionComplete(state) {
    // We have to wait until the transition has been finished
    this._controller.waitFor(function () {
      return !this._pbTransitionItem.getNode().hasAttribute('disabled');
    }, "Transition for Private Browsing mode has been finished.", undefined, undefined, this);
    this._controller.waitFor(function () {
      return this.enabled === state;
    }, "Private Browsing state has been changed. Expected '" + state + "'", undefined, undefined, this);
  }
}

// Export of classes
exports.privateBrowsing = privateBrowsing;
