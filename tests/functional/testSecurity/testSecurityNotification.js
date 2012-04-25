/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { expect } = require("../../../lib/assertions");

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

/**
 * Test the identity button and Bad Cert error page
 */
var testSecNotification = function() {
  // Go to a secure HTTPS site
  controller.open("https://addons.mozilla.org/licenses/5.txt");
  controller.waitForPageLoad();

  // Identity box should have a green background
  var identityBox = new elementslib.ID(controller.window.document, "identity-box");
  controller.assertJSProperty(identityBox, "className", "verifiedIdentity");

  // Go to an unsecure (HTTP) site
  controller.open("http://www.mozilla.org/");
  controller.waitForPageLoad();

  // Identity box should have a gray background
  controller.assertJSProperty(identityBox, "className", "unknownIdentity");

  // Go to a website which does not have a valid cert
  controller.open("https://mozilla.org/");
  controller.waitForPageLoad();

  // Verify the link in Technical Details is correct
  var link = new elementslib.ID(controller.tabs.activeTab, "cert_domain_link");
  controller.waitForElement(link, gTimeout);
  controller.assertJSProperty(link, "textContent", "*.mozilla.org");

  // Verify "Get Me Out Of Here!" button appears
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "getMeOutOfHereButton"));

  // Verify "Add Exception" button appears
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "exceptionDialogButton"));

  // Verify the error code is correct
  var text = new elementslib.ID(controller.tabs.activeTab, "technicalContentText");
  controller.waitForElement(text, gTimeout);
  expect.contain(text.getNode().textContent, "ssl_error_bad_cert_domain",
                 "The error code is a SSL Bad Cert Error");
}

// XXX: Bug 708491 - testSecurityNotification.js fails due to timeout
//      on cert_domain_link
setupModule.__force_skip__ = "Bug 708491 - testSecurityNotification.js fails"+
                             "due to timeout on cert_domain_link";
