/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Include the required modules
var prefs = require("../../shared-modules/testPrefsAPI");
var toolbars = require("../../shared-modules/testToolbarAPI");
var utils = require("../../shared-modules/testUtilsAPI");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'password_manager/login_form.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);

  pm = Cc["@mozilla.org/login-manager;1"].
       getService(Ci.nsILoginManager);
  pm.removeAllLogins();
}

var teardownModule = function(module) {
  // Just in case the test fails remove all passwords
  pm.removeAllLogins();
}

/**
 * Test the password post-submit notification
 */
var testPasswordNotificationBar = function() {
  // Go to the sample login page and perform a test log-in with input fields
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  var passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField, TIMEOUT);
  controller.type(userField, "bar");
  controller.type(passField, "foo");

  // After logging in, close the notification bar
  var passwordNotification = locationBar.getNotificationElement(
                               "password-save-notification"
                             );

  // The notification should not be visible before submitting the credentials
  controller.assertNodeNotExist(passwordNotification);

  controller.click(new elementslib.ID(controller.tabs.activeTab, "LogIn"));
  controller.waitForPageLoad();

  // Close the notification and check its state
  controller.keypress(passwordNotification, "VK_ESCAPE", {});
  controller.assert(function() {
    return passwordNotification.getNode().parentNode.state == "closed";
  }, "Password notification should be closed");
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
  prefs.openPreferencesDialog(prefDialogCallback);
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

/**
 * Map test functions to litmus tests
 */
// testPasswordNotificationBar.meta = {litmusids : [8522]};
// testPasswordNotSaved.meta = {litmusids : [8174]};
