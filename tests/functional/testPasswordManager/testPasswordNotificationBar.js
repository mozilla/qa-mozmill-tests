/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Cu.import("resource://gre/modules/Services.jsm");

// Include the required modules
var { assert } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'password_manager/login_form.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);

  Services.logins.removeAllLogins();
}

var teardownModule = function(module) {
  // Just in case the test fails remove all passwords
  Services.logins.removeAllLogins();
}

/**
 * Test the password post-submit notification
 */
var testPasswordNotification = function() {
  // Go to the sample login page and perform a test log-in with input fields
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  var passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField, TIMEOUT);
  controller.type(userField, "bar");
  controller.type(passField, "foo");

  // Click the login button and wait for the form to process
  var loginButton = new elementslib.ID(controller.tabs.activeTab, "LogIn");
  controller.click(loginButton);
  controller.waitForPageLoad();

  // Get a reference to the password-save notification
  var passwordNotification = locationBar.getNotificationElement(
                               "password-save-notification"
                             );

  // Close the notification and check its state
  controller.keypress(passwordNotification, "VK_ESCAPE", {});

  var notification = locationBar.getNotification();
  assert.waitFor(function () {
    return notification.getNode().state === "closed";
  }, "Password notification has been closed");
}
