/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include the required modules
var { assert, expect } = require("../../../../lib/assertions");
var modalDialog = require("../../../lib/modal-dialog");
var prefs = require("../../../lib/prefs");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "password_manager/login_form.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.locationBar = new toolbars.locationBar(aModule.controller);

  Services.logins.removeAllLogins();
}

function teardownModule() {
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

  var logInButton = new elementslib.ID(controller.tabs.activeTab, "LogIn");
  controller.click(logInButton);
  controller.waitForPageLoad();

  // After logging in, remember the login information
  var button = locationBar.getNotificationElement(
                 "password-save-notification",
                 {type: "anonid", value: "button"}
               );
  controller.waitThenClick(button);

  // Wait for the notification to unload
  locationBar.waitForNotification("notification_popup", false);

  // Go back to the login page and verify the password has been saved
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField);
  expect.equal(userField.getNode().value, "bar", "Username has been saved");
  expect.equal(passField.getNode().value, "foo", "Password has been saved");

  // Call preferences dialog and delete the saved password
  prefs.openPreferencesDialog(controller, prefDialogCallback);
}

/**
 * Go to the security pane and open the password manager
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function prefDialogCallback(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneSecurity';

  var showPasswords = new elementslib.ID(controller.window.document, "showPasswords");
  controller.waitThenClick(showPasswords);

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

  assert.equal(signOnsTree.view.rowCount, 1, "There is a saved password");

  // Delete all passwords and accept the deletion of the saved passwords
  var md = new modalDialog.modalDialog(controller.window);
  md.start(confirmHandler);

  controller.click(new elementslib.ID(controller.window.document, "removeAllSignons"));
  md.waitForDialog();

  expect.equal(signOnsTree.view.rowCount, 0, "There are no more saved passwords");

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
function confirmHandler(controller) {
  var dialogButton = new elementslib.Lookup(controller.window.document,
                                            '/id("commonDialog")' +
                                            '/anon({"anonid":"buttons"})' +
                                            '/{"dlgtype":"accept"}');

  controller.waitThenClick(dialogButton);
}
