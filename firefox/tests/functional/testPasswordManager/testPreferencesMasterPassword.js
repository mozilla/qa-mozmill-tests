/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");
var windows = require("../../../../lib/windows");

var browser = require("../../../lib/ui/browser");
var dialogs = require("../../../../lib/ui/dialogs");
var prefWindow = require("../../../lib/ui/pref-window");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "password_manager/login_form.html";

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

function setupModule(aModule) {
  prefs.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
}

function setupTest(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  persisted.nextTest = null;
}

function teardownTest(aModule) {
  controller.open("about:blank");

  if (persisted.nextTest) {
    controller.restartApplication(persisted.nextTest);
  }
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);

  delete persisted.nextTest;

  aModule.controller.stopApplication(true);
 }

/**
 * Test saving login information and setting a master password
 */
function testSetMasterPassword() {
  persisted.nextTest = "testInvokeMasterPassword";

  tabBrowser.closeAllTabs();

  // Go to the sample login page and perform a test log-in with input fields
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var userField = findElement.ID(controller.tabs.activeTab, "uname");
  var passField = findElement.ID(controller.tabs.activeTab, "Password");

  userField.waitForElement();
  controller.type(userField, "bar");
  controller.type(passField, "foo");

  var loginButton = findElement.ID(controller.tabs.activeTab, "LogIn");

  // Wait for the notification to load
  locationBar.waitForNotificationPanel(() => {
    loginButton.click();
  }, {type: "notification"});

  // After logging in, remember the login information
  var button = locationBar.getNotificationElement("password-save-notification",
                                                  {type: "anonid",
                                                   value: "button"});

  expect.ok(utils.isDisplayed(controller, button),
            "Remember password button is visible");

  // Wait for the notification to unload
  locationBar.waitForNotificationPanel(() => {
    button.click();
  }, {type: "notification", open: false});

  // Call preferences dialog and invoke master password functionality
  prefWindow.openPreferencesDialog(controller, prefDialogSetMasterPasswordCallback);
}

/**
 * Test invoking master password dialog when opening password manager
 */
function testInvokeMasterPassword() {
  persisted.nextTest = "testRemoveMasterPassword";

  // Call preferences dialog and invoke master password functionality
  prefWindow.openPreferencesDialog(controller, prefDialogInvokeMasterPasswordCallback);
}

/**
 * Test removing the master password
 */
function testRemoveMasterPassword() {
  // Call preferences dialog and invoke master password functionality
  prefWindow.openPreferencesDialog(controller, deleteMasterPassword);
}

/**
 * Handler for preferences dialog to set the Master Password
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function prefDialogSetMasterPasswordCallback(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  prefDialog.paneId = "paneSecurity";

  var masterPasswordCheck = findElement.ID(aController.window.document,
                                           "useMasterPassword");
  masterPasswordCheck.waitForElement();

  // Call setMasterPassword dialog and set a master password to your profile
  var md = new modalDialog.modalDialog(aController.window);
  md.start(masterPasswordHandler);

  masterPasswordCheck.click();
  md.waitForDialog();

  // Close the Preferences dialog
  prefDialog.close(true);
}

/**
 * Set the master password via the master password dialog
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function masterPasswordHandler(aController) {
  var pw1 = findElement.ID(aController.window.document, "pw1");
  var pw2 = findElement.ID(aController.window.document, "pw2");

  // Fill in the master password into both input fields and click ok
  pw1.waitForElement();
  aController.type(pw1, "test1");
  aController.type(pw2, "test1");

  // Call the confirmation dialog and click ok to go back to the preferences dialog
  var md = new modalDialog.modalDialog(aController.window);
  md.start(confirmHandler);

  var button = findElement.Lookup(aController.window.document,
                                  '/id("changemp")' +
                                  '/anon({"anonid":"buttons"})' +
                                  '/{"dlgtype":"accept"}');
  button.waitThenClick();
  md.waitForDialog();
}

/**
 * Call the confirmation dialog and click ok to go back to the preferences dialog
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function confirmHandler(aController) {
  var button = findElement.Lookup(aController.window.document,
                                  '/id("commonDialog")' +
                                  '/anon({"anonid":"buttons"})' +
                                  '/{"dlgtype":"accept"}');
  button.waitThenClick();
}

/**
 * Bring up the master password dialog via the preferences window
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function prefDialogInvokeMasterPasswordCallback(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  prefDialog.paneId = "paneSecurity";

  var showPasswordButton = findElement.ID(aController.window.document, "showPasswords");
  showPasswordButton.waitForElement();

  // Call showPasswords dialog and view the passwords on your profile
  var md = new modalDialog.modalDialog(aController.window);
  md.start(checkMasterHandler);

  showPasswordButton.click();
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
  var togglePasswords = findElement.ID(aController.window.document, "togglePasswords");
  var passwordCol = findElement.ID(aController.window.document, "passwordCol");

  togglePasswords.waitForElement();

  expect.ok(!utils.isDisplayed(aController, passwordCol),
            "Password column is hidden");

  // Call showPasswords dialog and view the passwords on your profile
  var md = new modalDialog.modalDialog(aController.window);
  md.start(checkMasterHandler);

  togglePasswords.click();
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
function checkMasterHandler(aController) {
  var dialog = new dialogs.CommonDialog(aController);

  var passwordBox = dialog.getElement({type: "password_textbox"});
  passwordBox.sendKeys("test1");

  dialog.accept();
}

/**
 * Delete the master password using the preferences window
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function deleteMasterPassword(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  prefDialog.paneId = "paneSecurity";

  var masterPasswordCheck = findElement.ID(aController.window.document,
                                           "useMasterPassword");
  masterPasswordCheck.waitForElement();

  // Call setMasterPassword dialog and remove the master password to your profile
  var md = new modalDialog.modalDialog(aController.window);
  md.start(removeMasterHandler);

  masterPasswordCheck.click();
  md.waitForDialog();

  // Close the Preferences dialog
  prefDialog.close(true);
}

/**
 * Remove the master password via the master password dialog
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function removeMasterHandler(aController) {
  var removePwdField = findElement.ID(aController.window.document, "password");

  removePwdField.waitForElement();
  removePwdField.sendKeys("test1");

  // Call the confirmation dialog and click ok to go back to the preferences dialog
  var md = new modalDialog.modalDialog(aController.window);
  md.start(confirmHandler);

  var button = findElement.Lookup(aController.window.document,
                                  '/id("removemp")' +
                                  '/anon({"anonid":"buttons"})' +
                                  '/{"dlgtype":"accept"}');
  button.click();
  md.waitForDialog();
}

/**
 * Call the confirmation dialog and click ok to go back to the preferences dialog
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function confirmHandler(aController) {
  var dialog = new dialogs.CommonDialog(aController);
  dialog.accept();
}
