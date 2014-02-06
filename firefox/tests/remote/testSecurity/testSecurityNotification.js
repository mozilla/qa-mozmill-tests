/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");

const TEST_DATA = [
  // Invalid cert page
  "https://summitbook.mozilla.org",
  // Secure page
  "https://addons.mozilla.org/licenses/5.txt",
  // Unsecure page
  "http://www.mozilla.org"
];

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

/**
 * Test the identity button and Bad Cert error page
 */
var testSecNotification = function() {
  // Go to a secure HTTPS site
  controller.open(TEST_DATA[1]);
  controller.waitForPageLoad();

  var identityBox = new elementslib.ID(controller.window.document, "identity-box");

  expect.waitFor(function () {
    return identityBox.getNode().className === "verifiedIdentity";
  }, "Identity is verified");

  // Go to an unsecure (HTTP) site
  controller.open(TEST_DATA[2]);
  controller.waitForPageLoad();

  expect.waitFor(function () {
    return identityBox.getNode().className === "unknownIdentity";
  }, "Identity is unknown");

  // Go to a website which does not have a valid cert
  controller.open(TEST_DATA[0]);
  controller.waitForPageLoad();

  // Verify the info in Technical Details contains the invalid cert page
  var text = new elementslib.ID(controller.tabs.activeTab, "technicalContentText");
  controller.waitForElement(text);
  expect.contain(text.getNode().textContent, TEST_DATA[0].substring(8),
                 "Details contain the invalid cert page");

  // Verify "Get Me Out Of Here!" button appears
  var getMeOutOfHereButton = new elementslib.ID(controller.tabs.activeTab,
                                                "getMeOutOfHereButton");
  assert.ok(getMeOutOfHereButton.exists(), "'Get me out of here' button has been found");

  // Verify "Add Exception" button appears
  var exceptionDialogButton = new elementslib.ID(controller.tabs.activeTab,
                                                 "exceptionDialogButton");
  assert.ok(exceptionDialogButton.exists(), "'Exception dialog' button has been found");

  // Verify the error code is correct
  expect.contain(text.getNode().textContent, "sec_error_expired_certificate",
                 "The error code is a SEC Expired certificate error");
}
