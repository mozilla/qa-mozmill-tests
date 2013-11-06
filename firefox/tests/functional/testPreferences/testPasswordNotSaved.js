/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include the required modules
var { expect } = require("../../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "password_manager/login_form.html";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  Services.logins.removeAllLogins();
}

var teardownModule = function(aModule) {
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
  prefs.openPreferencesDialog(controller, prefDialogCallback);
}

/**
 * Open the password manager from the security pane
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneSecurity';

  var showPasswords = new elementslib.ID(controller.window.document, "showPasswords");
  controller.waitThenClick(showPasswords);

  utils.handleWindow("type", "Toolkit:PasswordManager", checkPasswordsNotSaved);

  prefDialog.close(true);
}

/**
 * Check that passwords haven't been saved
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function checkPasswordsNotSaved(controller) {
  var filterField = new elementslib.ID(controller.window.document, "filter");
  controller.waitForElement(filterField);

  var removeLogin = new elementslib.ID(controller.window.document, "removeSignon");
  expect.ok(removeLogin.getNode().disabled, "Remove Passwords Button is disabled");

  // Close the password manager
  var dtds = ["chrome://passwordmgr/locale/passwordManager.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  controller.keypress(null, cmdKey, {accelKey: true});
}
