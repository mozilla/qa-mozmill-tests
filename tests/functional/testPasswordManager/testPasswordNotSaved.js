/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var prefs = require("../../../lib/prefs");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'password_manager/login_form.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();

  pm = Cc["@mozilla.org/login-manager;1"].
       getService(Ci.nsILoginManager);
  pm.removeAllLogins();
}

var teardownModule = function(module) {
  // Just in case the test fails remove all passwords
  pm.removeAllLogins();
}

/**
 * Verify passwords are not saved when we select not to save them
 */
var testPasswordNotSaved = function() {
  // Go back verify the login information has not been saved
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  var passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField, TIMEOUT);
  controller.assertValue(userField, "");
  controller.assertValue(passField, "");

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
  controller.waitThenClick(showPasswords, TIMEOUT);

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
  controller.waitForElement(filterField, TIMEOUT);

  var removeLogin = new elementslib.ID(controller.window.document, "removeSignon");
  controller.assertJSProperty(removeLogin, 'disabled', 'true');

  // Close the password manager
  var dtds = ["chrome://passwordmgr/locale/passwordManager.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  controller.keypress(null, cmdKey, {accelKey: true});
}

// XXX: Bug 710347 - Failure in testPasswordManager :: testPasswordNotSaved
setupModule.__force_skip__ = "Bug 710347 - Failure in testPasswordManager :: testPasswordNotSaved";
teardownModule.__force_skip__ = "Bug 710347 - Failure in testPasswordManager :: testPasswordNotSaved";

