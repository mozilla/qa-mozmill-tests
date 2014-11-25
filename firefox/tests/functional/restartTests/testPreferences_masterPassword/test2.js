/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { expect } = require("../../../../../lib/assertions");
var modalDialog = require("../../../../../lib/modal-dialog");
var prefs = require("../../../../../lib/prefs");
var utils = require("../../../../../lib/utils");
var windows = require("../../../../../lib/windows");

var prefWindow = require("../../../../lib/ui/pref-window");

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  prefs.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
}

var teardownModule = function(aModule) {
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);

  aModule.controller.restartApplication();
}

/**
 * Test invoking master password dialog when opening password manager
 */
var testInvokeMasterPassword = function() {
  // Call preferences dialog and invoke master password functionality
  prefWindow.openPreferencesDialog(controller, prefDialogInvokeMasterPasswordCallback);
}

/**
 * Bring up the master password dialog via the preferences window
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var prefDialogInvokeMasterPasswordCallback = function(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  prefDialog.paneId = 'paneSecurity';

  var showPasswordButton = new elementslib.ID(aController.window.document, "showPasswords");
  aController.waitForElement(showPasswordButton);

  // Call showPasswords dialog and view the passwords on your profile
  var md = new modalDialog.modalDialog(aController.window);
  md.start(checkMasterHandler);

  aController.click(showPasswordButton);
  md.waitForDialog();

  // Check if the password manager has been opened
  windows.handleWindow("type", "Toolkit:PasswordManager", checkPasswordManager);

  prefDialog.close(true);
}

/**
 * Check that the saved passwords are shown
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function checkPasswordManager(aController) {
  var togglePasswords = new elementslib.ID(aController.window.document, "togglePasswords");
  var passwordCol = new elementslib.ID(aController.window.document, "passwordCol");

  aController.waitForElement(togglePasswords);

  expect.ok(!utils.isDisplayed(aController, passwordCol),
            "Password column is hidden");

  // Call showPasswords dialog and view the passwords on your profile
  var md = new modalDialog.modalDialog(aController.window);
  md.start(checkMasterHandler);

  aController.click(togglePasswords);
  md.waitForDialog();

  expect.ok(utils.isDisplayed(aController, passwordCol),
            "Password column is visible");


  // Close the password manager
  var dtds = ["chrome://passwordmgr/locale/passwordManager.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  aController.keypress(null, cmdKey, {accelKey: true});
}

/**
 * Verify the master password dialog is invoked
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var checkMasterHandler = function(aController) {
  var passwordBox = new elementslib.ID(aController.window.document, "password1Textbox");

  aController.waitForElement(passwordBox);
  aController.type(passwordBox, "test1");

  var button = new elementslib.Lookup(aController.window.document,
                               '/id("commonDialog")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  aController.click(button);
}
