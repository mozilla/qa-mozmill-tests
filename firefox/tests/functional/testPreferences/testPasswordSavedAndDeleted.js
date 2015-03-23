/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include the required modules
var { assert, expect } = require("../../../../lib/assertions");
var dialogs = require("../../../../lib/ui/dialogs");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");
var windows = require("../../../../lib/windows");

var browser = require("../../../lib/ui/browser");
var prefWindow = require("../../../lib/ui/pref-window");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "password_manager/login_form.html";

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  prefs.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
  Services.logins.removeAllLogins();
}

function teardownModule() {
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);

  // Just in case the test fails remove all cookies
  Services.logins.removeAllLogins();
}

/* Test if Password is saved and deleted */
function testSaveAndDeletePassword() {
  // Go to the sample login page and log-in with inputted fields
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  var passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField);
  controller.type(userField, "bar");
  controller.type(passField, "foo");

  // Wait for the notification to load
  locationBar.waitForNotificationPanel(() => {
    var logInButton = new elementslib.ID(controller.tabs.activeTab, "LogIn");
    logInButton.click();
    controller.waitForPageLoad();
  }, {type: "notification"});

  // Wait for the notification to unload
  locationBar.waitForNotificationPanel(() => {
    // After logging in, remember the login information
    var button = locationBar.getNotificationElement(
                   "password-save-notification",
                   {type: "anonid", value: "button"}
                 );
    button.click();
  }, {type: "notification", open: false});

  // Go back to the login page and verify the password has been saved
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField);
  expect.waitFor(() => (userField.getNode().value === "bar"),
                 "Username has been saved");
  expect.waitFor(() => (passField.getNode().value === "foo"),
                 "Password has been saved");

  // Call preferences dialog and delete the saved password
  prefWindow.openPreferencesDialog(controller, prefDialogCallback);
}

/**
 * Go to the security pane and open the password manager
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function prefDialogCallback(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);
  prefDialog.paneId = 'paneSecurity';

  var showPasswords = new elementslib.ID(aController.window.document, "showPasswords");
  aController.waitThenClick(showPasswords);

  windows.handleWindow("type", "Toolkit:PasswordManager", deleteAllPasswords);


  // Close the preferences dialog
  prefDialog.close(true);
}

/**
 * Delete all passwords
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function deleteAllPasswords(aController) {
  var signOnsTree = aController.window.document.getElementById("signonsTree");

  assert.equal(signOnsTree.view.rowCount, 1, "There is a saved password");

  // Delete all passwords and accept the deletion of the saved passwords
  var md = new modalDialog.modalDialog(aController.window);
  md.start(confirmHandler);

  aController.click(new elementslib.ID(aController.window.document, "removeAllSignons"));
  md.waitForDialog();

  expect.equal(signOnsTree.view.rowCount, 0, "There are no more saved passwords");

  // Close the password manager
  var dtds = ["chrome://passwordmgr/locale/passwordManager.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  aController.keypress(null, cmdKey, {accelKey: true});
}

/**
 * Call the confirmation dialog and click ok to go back to the password manager
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function confirmHandler(aController) {
  var dialog = new dialogs.CommonDialog(aController);
  dialog.accept();
}
