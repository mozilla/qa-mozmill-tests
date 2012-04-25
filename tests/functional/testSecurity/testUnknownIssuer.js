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
 * Test to see if the Unknown Issuer error page appears
 *
 */
var testUnknownIssuer = function() {
  // Go to a website with an unknown cert issuer
  controller.open('https://mur.at');
  controller.waitForPageLoad();

  // Verify the link in Technical Details is correct
  var link = new elementslib.ID(controller.tabs.activeTab, "cert_domain_link");
  controller.waitForElement(link, gTimeout);
  controller.assertJSProperty(link, "textContent", "secure.mur.at");

  // Verify "Get Me Out Of Here!" button appears
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "getMeOutOfHereButton"));

  // Verify "Add Exception" button appears
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "exceptionDialogButton"));

  // Verify the error code is correct
  var text = new elementslib.ID(controller.tabs.activeTab, "technicalContentText");
  controller.waitForElement(text, gTimeout);
  expect.contain(text.getNode().textContent, "sec_error_unknown_issuer",
                 "The error code is an unknown issuer error");
}

/**
 * Map test functions to litmus tests
 */
// testUnknownIssuer.meta = {litmusids : [8900]};
