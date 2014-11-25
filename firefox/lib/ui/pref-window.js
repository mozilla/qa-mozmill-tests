/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The Firefox UI prefs library adds support for preferences related functions.
 * It allows to handle the preferences dialog.
 *
 * @version 1.0.0
 */

// Include required modules
var { assert, expect } = require("../../../lib/assertions");
var modalDialog = require("../../../lib/modal-dialog");
var prefs = require("../../../lib/prefs");
var windows = require("../../../lib/windows");

const PREF_PANE_ANIMATION = "browser.preferences.animateFadeIn";

// Preferences dialog element templates
const PREF_DIALOG_BUTTONS  = '/{"type":"prefwindow"}/anon({"anonid":"dlg-buttons"})';
const PREF_DIALOG_DECK     = '/{"type":"prefwindow"}/anon({"class":"paneDeckContainer"})/anon({"anonid":"paneDeck"})';
const PREF_DIALOG_SELECTOR = '/{"type":"prefwindow"}/anon({"orient":"vertical"})/anon({"anonid":"selector"})';


/**
 * Constructor
 *
 * @param {MozMillController} aController
 *        MozMill controller of the browser window to operate on.
 */
function preferencesDialog(aController) {
  this._controller = aController;
}

/**
 * Preferences dialog object to simplify the access to this dialog
 */
preferencesDialog.prototype = {
  /**
   * Returns the MozMill controller
   *
   * @returns Mozmill controller
   * @type {MozMillController}
   */
  get controller() {
    return this._controller;
  },

  /**
   * Retrieve the currently selected panel
   *
   * @returns The panel element
   * @type {ElemBase}
   */
  get selectedPane() {
    return this.getElement({type: "deck_pane"});
  },

  /**
   * Get the given pane id
   */
  get paneId() {
    // Check if the selector and the pane are consistent
    var selector = this.getElement({type: "selector"});

    expect.waitFor(function () {
      return selector.getNode().selectedItem.getAttribute('pane') === this.selectedPane.getNode().id;
    }, "Pane has been changed - expected '" + this.selectedPane.getNode().id + "'",
       undefined, undefined, this);

    return this.selectedPane.getNode().id;
  },

  /**
   * Set the given pane by id
   *
   * @param {string} aId of the pane
   */
  set paneId(aId) {
    // Disable the animation when switching panes
    prefs.setPref(PREF_PANE_ANIMATION, false);

    var button = this.getElement({type: "selector_button", value: aId});
    this._controller.waitThenClick(button);

    try {
      var documentElement = this._controller.window.document.documentElement;

      assert.waitFor(function () {
        return documentElement.lastSelected === aId;
      }, "Pane has been changed - expected '" + aId + "'");
    }
    catch (e) {
      throw e;
    }
    finally {
      prefs.clearUserPref(PREF_PANE_ANIMATION);
    }

    return this.paneId;
  },

  /**
   * Close the preferences dialog
   *
   * @param {MozMillController} controller
   *        MozMillController of the window to operate on
   * @param {boolean} aSaveChanges
   *        (Optional) If true the OK button is clicked on Windows which saves
   *        the changes. On OS X and Linux changes are applied immediately
   */
  close : function preferencesDialog_close(aSaveChanges) {
    saveChanges = (aSaveChanges == undefined) ? false : aSaveChanges;

    if (mozmill.isWindows) {
      var button = this.getElement({type: "button", subtype: (saveChanges ? "accept" : "cancel")});
      this._controller.click(button);
    }
    else {
      this._controller.keypress(null, 'w', {accelKey: true});
    }
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function preferencesDialog_getDtds() {
    var dtds = ["chrome://browser/locale/preferences/aboutPermissions.dtd",
		 "chrome://browser/locale/preferences/advanced-scripts.dtd",
		 "chrome://browser/locale/preferences/advanced.dtd",
		 "chrome://browser/locale/preferences/applicationManager.dtd",
		 "chrome://browser/locale/preferences/applications.dtd",
		 "chrome://browser/locale/preferences/colors.dtd",
		 "chrome://browser/locale/preferences/connection.dtd",
		 "chrome://browser/locale/preferences/content.dtd",
		 "chrome://browser/locale/preferences/cookies.dtd",
		 "chrome://browser/locale/preferences/fonts.dtd",
		 "chrome://browser/locale/preferences/languages.dtd",
		 "chrome://browser/locale/preferences/main.dtd",
		 "chrome://browser/locale/preferences/permissions.dtd",
		 "chrome://browser/locale/preferences/preferences.dtd",
		 "chrome://browser/locale/preferences/privacy.dtd",
		 "chrome://browser/locale/preferences/security.dtd",
		 "chrome://browser/locale/preferences/selectBookmark.dtd",
		 "chrome://browser/locale/preferences/sync.dtd",
		 "chrome://browser/locale/preferences/tabs.dtd"];
    return dtds;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   *        type: General type information
   *        subtype: Specific element or property
   *        value: Value of the element or property
   * @returns Element which has been created
   * @type {ElemBase}
   */
  getElement : function aboutSessionRestore_getElement(aSpec) {
    var elem = null;

    switch(aSpec.type) {
      case "button":
        elem = new elementslib.Lookup(this._controller.window.document, PREF_DIALOG_BUTTONS +
                                      '/{"dlgtype":"' + aSpec.subtype + '"}');
        break;
      case "deck":
        elem = new elementslib.Lookup(this._controller.window.document, PREF_DIALOG_DECK);
        break;
      case "deck_pane":
        var deck = this.getElement({type: "deck"}).getNode();

        // Bug 390724
        // selectedPane is broken. So iterate through all elements
        var panel = deck.boxObject.firstChild;
        for (var ii = 0; ii < deck.selectedIndex; ii++)
          panel = panel.nextSibling;

        elem = new elementslib.Elem(panel);
        break;
      case "selector":
        elem = new elementslib.Lookup(this._controller.window.document, PREF_DIALOG_SELECTOR);
        break;
      case "selector_button":
        elem = new elementslib.Lookup(this._controller.window.document, PREF_DIALOG_SELECTOR +
                                      '/{"pane":"' + aSpec.value + '"}');
        break;
      default:
        assert.fail("Unknown element type - " + aSpec.type);
    }

    return elem;
  }
};

/**
 * Open the preferences dialog and call the given handler
 *
 * @param {MozMillController} aController
 *        MozMillController which is the opener of the preferences dialog
 * @param {function} aCallback
 *        The callback handler to use to interact with the preference dialog
 * @param {function} aLauncher
 *        (Optional) A callback handler to launch the preference dialog
 */
function openPreferencesDialog(aController, aCallback, aLauncher) {
  assert.ok(aController, "Controller for Preferences Dialog has been specified");
  assert.equal(typeof aCallback, "function", "Callback for Preferences Dialog has been specified");

  if (mozmill.isWindows) {
    // Preference dialog is modal on windows, set up our callback
    var prefModal = new modalDialog.modalDialog(aController.window);
    prefModal.start(aCallback);
  }

  // Launch the preference dialog
  if (aLauncher) {
    aLauncher();
  }
  else {
    mozmill.getPreferencesController();
  }

  if (mozmill.isWindows) {
    prefModal.waitForDialog();
  }
  else {
    // Get the window type of the preferences window depending on the application
    var prefWindowType = null;
    switch (mozmill.Application) {
      case "Thunderbird":
        prefWindowType = "Mail:Preferences";
        break;
      default:
        prefWindowType = "Browser:Preferences";
    }

    windows.handleWindow("type", prefWindowType, aCallback);
  }
}

// Export of functions
exports.openPreferencesDialog = openPreferencesDialog;

// Export of classes
exports.preferencesDialog = preferencesDialog;
