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

// Include required modules
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");
var utils = require("../../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'password_manager/login_form.html';


var setupModule = function() {
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);

  tabBrowser.closeAllTabs();
}

/**
 * Test saving login information and setting a master password
 */
var testSetMasterPassword = function() {

  // Go to the sample login page and perform a test log-in with inputted fields
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  var passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField);
  controller.type(userField, "bar");
  controller.type(passField, "foo");

  var loginButton = new elementslib.ID(controller.tabs.activeTab, "LogIn");
  controller.waitThenClick(loginButton);

  tabBrowser.waitForTabPanel(tabBrowser.selectedIndex,
                             '/{"value":"password-save"}');

  // Get the label of the Remember Password button
  var label = utils.getProperty(
                "chrome://passwordmgr/locale/passwordmgr.properties",
                "notifyBarRememberButtonText"
              );

  // Get the Remember Password button based on the above label
  var button = tabBrowser.getTabPanelElement(
                 tabBrowser.selectedIndex,
                '/{"value":"password-save"}/{"label":"' + label + '"}'
               );
  utils.assertElementVisible(controller, button, true);
  controller.waitThenClick(button);
  controller.sleep(500);
  controller.assertNodeNotExist(button);

  // Call preferences dialog and invoke master password functionality
  prefs.openPreferencesDialog(controller, prefDialogSetMasterPasswordCallback);
}

/**
 * Handler for preferences dialog to set the Master Password
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogSetMasterPasswordCallback = function(controller)
{
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneSecurity';

  var masterPasswordCheck = new elementslib.ID(controller.window.document, "useMasterPassword");
  controller.waitForElement(masterPasswordCheck);

  // Call setMasterPassword dialog and set a master password to your profile
  var md = new modalDialog.modalDialog(controller.window);
  md.start(masterPasswordHandler);

  controller.click(masterPasswordCheck);
  md.waitForDialog();

  // Close the Preferences dialog
  prefDialog.close(true);
}

/**
 * Set the master password via the master password dialog
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var masterPasswordHandler = function(controller) {
  var pw1 = new elementslib.ID(controller.window.document, "pw1");
  var pw2 = new elementslib.ID(controller.window.document, "pw2");

  // Fill in the master password into both input fields and click ok
  controller.waitForElement(pw1);
  controller.type(pw1, "test1");
  controller.type(pw2, "test1");

  // Call the confirmation dialog and click ok to go back to the preferences dialog
  var md = new modalDialog.modalDialog(controller.window);
  md.start(confirmHandler);

  var button = new elementslib.Lookup(controller.window.document,
                           '/id("changemp")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  controller.waitThenClick(button);
  md.waitForDialog();
}

/**
 * Call the confirmation dialog and click ok to go back to the preferences dialog
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var confirmHandler = function(controller)
{
  var button = new elementslib.Lookup(controller.window.document,
                               '/id("commonDialog")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  controller.waitThenClick(button);
}
