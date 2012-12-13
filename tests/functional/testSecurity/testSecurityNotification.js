/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { expect } = require("../../../lib/assertions");

const INVALID_CERT_PAGE = "https://summitbook.mozilla.org";
const SECURE_PAGE = "https://addons.mozilla.org/licenses/5.txt";
const UNSECURE_PAGE = "http://www.mozilla.org";

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

/**
 * Test the identity button and Bad Cert error page
 */
var testSecNotification = function() {
  // Go to a secure HTTPS site
  controller.open(SECURE_PAGE);
  controller.waitForPageLoad();

  var identityBox = new elementslib.ID(controller.window.document, "identity-box");
  expect.equal(identityBox.getNode().className, "verifiedIdentity", "Identity is verified");

  // Go to an unsecure (HTTP) site
  controller.open(UNSECURE_PAGE);
  controller.waitForPageLoad();

  expect.equal(identityBox.getNode().className, "unknownIdentity", "Identity is unknown");

  // Go to a website which does not have a valid cert
  controller.open(INVALID_CERT_PAGE);
  controller.waitForPageLoad();

  // Verify the info in Technical Details contains the invalid cert page
  var text = new elementslib.ID(controller.tabs.activeTab, "technicalContentText");
  controller.waitForElement(text);
  expect.contain(text.getNode().textContent, INVALID_CERT_PAGE.substring(8),
                 "Details contain the invalid cert page");

  // Verify "Get Me Out Of Here!" button appears
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "getMeOutOfHereButton"));

  // Verify "Add Exception" button appears
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "exceptionDialogButton"));

  // Verify the error code is correct
  expect.contain(text.getNode().textContent, "sec_error_expired_certificate",
                 "The error code is a SEC Expired certificate error");
}

