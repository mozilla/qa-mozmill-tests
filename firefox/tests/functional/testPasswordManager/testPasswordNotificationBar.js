/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include the required modules
var { assert } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "password_manager/login_form.html";

var setupModule = function(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  Services.logins.removeAllLogins();
}

var teardownModule = function(aModule) {
  // Just in case the test fails remove all passwords
  Services.logins.removeAllLogins();
}

/**
 * Test the password post-submit notification
 */
var testPasswordNotification = function() {
  // Go to the sample login page and perform a test log-in with input fields
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  var passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField);
  controller.type(userField, "bar");
  controller.type(passField, "foo");

  // Click the login button and wait for the form to process
  var loginButton = new elementslib.ID(controller.tabs.activeTab, "LogIn");
  locationBar.waitForNotificationPanel(() => {
    loginButton.click();
    controller.waitForPageLoad();
  }, {type: "notification"});

  // Close the notification and wait for it to unload
  locationBar.waitForNotificationPanel((aPanel) => {
    aPanel.keypress("VK_ESCAPE", {});
  }, {type: "notification", open: false});
}
