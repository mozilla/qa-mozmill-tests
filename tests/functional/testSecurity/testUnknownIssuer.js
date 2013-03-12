/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { assert, expect } = require("../../../lib/assertions");

const TIMEOUT = 5000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

/**
 * Test to see if the Unknown Issuer error page appears
 *
 */
var testUnknownIssuer = function() {
  // Go to a website with an unknown cert issuer
  controller.open('https://mur.at');
  controller.waitForPageLoad();

  var link = new elementslib.ID(controller.tabs.activeTab, "cert_domain_link");
  controller.waitForElement(link, TIMEOUT);
  expect.equal(link.getNode().textContent, "secure.mur.at", "Domain name is visible");

  // Verify "Get Me Out Of Here!" button appears
  var  getMeOutOfHereButton = new elementslib.ID(controller.tabs.activeTab, "getMeOutOfHereButton");
  assert.ok(getMeOutOfHereButton.exists(), "'Get me out of here' button has been found");

  // Verify "Add Exception" button appears
  var exceptionDialogButton = new elementslib.ID(controller.tabs.activeTab, "exceptionDialogButton");
  assert.ok(exceptionDialogButton.exists(), "'Exception dialog' button has been found");

  // Verify the error code is correct
  var text = new elementslib.ID(controller.tabs.activeTab, "technicalContentText");
  controller.waitForElement(text, TIMEOUT);
  expect.contain(text.getNode().textContent, "sec_error_unknown_issuer",
                 "The error code is an unknown issuer error");
}

/**
 * Map test functions to litmus tests
 */
// testUnknownIssuer.meta = {litmusids : [8900]};

// Bug 705182 - Timeout failure in testSafeBrowsingWarningPages.js
setupModule.__force_skip__ = "Bug 763159 - Test failure 'secure.mur.at == erle.mur.at'" +
                             " in testSecurity/testUnknownIssuer.js";
