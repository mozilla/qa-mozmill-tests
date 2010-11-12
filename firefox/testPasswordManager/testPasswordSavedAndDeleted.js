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
 *   Anthony Hughes <ahughes@mozilla.com>
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
var modalDialog = require("../../shared-modules/modal-dialog");
var prefs = require("../../shared-modules/prefs");
var tabs = require("../../shared-modules/tabs");
var utils = require("../../shared-modules/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'password_manager/login_form.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);

  pm = Cc["@mozilla.org/login-manager;1"].
       getService(Ci.nsILoginManager);
  pm.removeAllLogins();
}

var teardownModule = function() {
  // Just in case the test fails remove all cookies
  pm.removeAllLogins();
}

/**
 * Test saving a password using the notification bar
 */
var testSavePassword = function() {
  // Go to the sample login page and log-in with inputted fields
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  var passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField, TIMEOUT);
  controller.type(userField, "bar");
  controller.type(passField, "foo");

  var logInButton = new elementslib.ID(controller.tabs.activeTab, "LogIn");
  controller.click(logInButton);
  
  // Wait for the notification bar to appear
  tabBrowser.waitForTabPanel(tabBrowser.selectedIndex,
                             '/{"value":"password-save"}');

  // After logging in, remember the login information
  var label = utils.getProperty("chrome://passwordmgr/locale/passwordmgr.properties", 
                                   "notifyBarRememberButtonText");
  var button = tabBrowser.getTabPanelElement(tabBrowser.selectedIndex,
                                             '/{"value":"password-save"}' + 
                                             '/{"label":"' + label + '"}');

  controller.waitThenClick(button, TIMEOUT);
  controller.sleep(500);
  controller.assertNodeNotExist(button);

  // Go back to the login page and verify the password has been saved
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField, TIMEOUT);
  controller.assertValue(userField, "bar");
  controller.assertValue(passField, "foo");
}

/**
 * Test the deletion of a password from the password manager dialog
 */
var testDeletePassword = function() {
  // Call preferences dialog and delete the saved password
  prefs.openPreferencesDialog(prefDialogCallback);
}

/**
 * Go to the security pane and open the password manager
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneSecurity';

  var showPasswords = new elementslib.ID(controller.window.document, "showPasswords");
  controller.waitThenClick(showPasswords, TIMEOUT);

  utils.handleWindow("type", "Toolkit:PasswordManager", deleteAllPasswords);


  // Close the preferences dialog
  prefDialog.close(true);
}

/**
 * Delete all passwords
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function deleteAllPasswords(controller) {
  var signOnsTree = controller.window.document.getElementById("signonsTree");

  // Verify there is at least one saved password
  controller.assertJS("subject.view.rowCount == 1", signOnsTree);

  // Delete all passwords and accept the deletion of the saved passwords
  var md = new modalDialog.modalDialog(confirmHandler);
  md.start(200);

  controller.click(new elementslib.ID(controller.window.document, "removeAllSignons"));
  controller.assertJS("subject.view.rowCount == 0", signOnsTree);

  // Close the password manager
  var dtds = ["chrome://passwordmgr/locale/passwordManager.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  controller.keypress(null, cmdKey, {accelKey: true});
}

/**
 * Call the confirmation dialog and click ok to go back to the password manager
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var confirmHandler = function(controller) {
  var dialogButton = new elementslib.Lookup(controller.window.document,
                                            '/id("commonDialog")' +
                                            '/anon({"anonid":"buttons"})' +
                                            '/{"dlgtype":"accept"}');
  
  controller.waitThenClick(dialogButton, TIMEOUT);
}

/**
 * Map test functions to litmus tests
 */
// testSavePassword.meta = {litmusids : [8172]};
// testDeletePassword.meta = {litmusids : [8173]};
