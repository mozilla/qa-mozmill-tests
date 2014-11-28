/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include the required modules
var { expect } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");
var windows = require("../../../../lib/windows");

var prefWindow = require("../../../lib/ui/pref-window");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "password_manager/login_form.html";

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  prefs.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
  Services.logins.removeAllLogins();
}

var teardownModule = function(aModule) {
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);

  // Just in case the test fails remove all passwords
  Services.logins.removeAllLogins();
}

/**
 * Verify passwords are not saved when we select not to save them
 */
var testPasswordNotSaved = function() {
  // Go back verify the login information has not been saved
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  var passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField);
  expect.equal(userField.getNode().value, "", "Username has not been saved");
  expect.equal(passField.getNode().value, "", "Password has not been saved");

  // Call preferences dialog and check that no password has been saved
  prefWindow.openPreferencesDialog(controller, prefDialogCallback);
}

/**
 * Open the password manager from the security pane
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);
  prefDialog.paneId = 'paneSecurity';

  var showPasswords = new elementslib.ID(aController.window.document, "showPasswords");
  aController.waitThenClick(showPasswords);

  windows.handleWindow("type", "Toolkit:PasswordManager", checkPasswordsNotSaved);

  prefDialog.close(true);
}

/**
 * Check that passwords haven't been saved
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function checkPasswordsNotSaved(aController) {
  var filterField = new elementslib.ID(aController.window.document, "filter");
  aController.waitForElement(filterField);

  var removeLogin = new elementslib.ID(aController.window.document, "removeSignon");
  expect.ok(removeLogin.getNode().disabled, "Remove Passwords Button is disabled");

  // Close the password manager
  var dtds = ["chrome://passwordmgr/locale/passwordManager.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  aController.keypress(null, cmdKey, {accelKey: true});
}
