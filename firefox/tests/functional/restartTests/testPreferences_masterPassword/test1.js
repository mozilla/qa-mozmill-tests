/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { expect } = require("../../../../../lib/assertions");
var modalDialog = require("../../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");
var utils = require("../../../../../lib/utils");

var browser = require("../../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../../data/");
const TEST_DATA = BASE_URL + "password_manager/login_form.html";

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

var setupModule = function(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  prefs.preferences.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.preferences.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
  aModule.tabBrowser.closeAllTabs();
}

var teardownModule = function(aModule) {
  controller.open("about:blank");

  prefs.preferences.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.preferences.clearUserPref(PREF_BROWSER_INSTANT_APPLY);

  aModule.controller.restartApplication();
}

/**
 * Test saving login information and setting a master password
 */
var testSetMasterPassword = function() {
  // Go to the sample login page and perform a test log-in with inputted fields
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  var passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField);
  controller.type(userField, "bar");
  controller.type(passField, "foo");

  var loginButton = new elementslib.ID(controller.tabs.activeTab, "LogIn");

  // Wait for the notification to load
  locationBar.waitForNotificationPanel(() => {
    loginButton.click();
  }, {type: "notification"});

  // After logging in, remember the login information
  var button = locationBar.getNotificationElement(
                 "password-save-notification",
                 {type: "anonid", value: "button"}
               );

  expect.ok(utils.isDisplayed(controller, button),
            "Remember password button is visible");

  // Wait for the notification to unload
  locationBar.waitForNotificationPanel(() => {
    button.click();
  }, {type: "notification", open: false});

  // Call preferences dialog and invoke master password functionality
  prefs.openPreferencesDialog(controller, prefDialogSetMasterPasswordCallback);
}

/**
 * Handler for preferences dialog to set the Master Password
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var prefDialogSetMasterPasswordCallback = function(aController) {
  var prefDialog = new prefs.preferencesDialog(aController);

  prefDialog.paneId = 'paneSecurity';

  var masterPasswordCheck = new elementslib.ID(aController.window.document, "useMasterPassword");
  aController.waitForElement(masterPasswordCheck);

  // Call setMasterPassword dialog and set a master password to your profile
  var md = new modalDialog.modalDialog(aController.window);
  md.start(masterPasswordHandler);

  aController.click(masterPasswordCheck);
  md.waitForDialog();

  // Close the Preferences dialog
  prefDialog.close(true);
}

/**
 * Set the master password via the master password dialog
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var masterPasswordHandler = function(aController) {
  var pw1 = new elementslib.ID(aController.window.document, "pw1");
  var pw2 = new elementslib.ID(aController.window.document, "pw2");

  // Fill in the master password into both input fields and click ok
  aController.waitForElement(pw1);
  aController.type(pw1, "test1");
  aController.type(pw2, "test1");

  // Call the confirmation dialog and click ok to go back to the preferences dialog
  var md = new modalDialog.modalDialog(aController.window);
  md.start(confirmHandler);

  var button = new elementslib.Lookup(aController.window.document,
                           '/id("changemp")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  aController.waitThenClick(button);
  md.waitForDialog();
}

/**
 * Call the confirmation dialog and click ok to go back to the preferences dialog
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var confirmHandler = function(aController) {
  var button = new elementslib.Lookup(aController.window.document,
                               '/id("commonDialog")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  aController.waitThenClick(button);
}

