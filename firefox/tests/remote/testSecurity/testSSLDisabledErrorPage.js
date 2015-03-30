/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

const TEST_DATA = "https://tlsv1-0.mozqa.com";

const PREF_TLS_MIN = "security.tls.version.min";
const PREF_TLS_MAX = "security.tls.version.max";

// TODO: move the dtds to a SecurityAPI, if one will be created
const DTDS = ["chrome://browser/locale/netError.dtd"];

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  tabs.closeAllTabs(aModule.controller);
  utils.sanitize({ sessions: true });

  // Disable SSL 3.0, TLS 1.0 and TLS 1.1 for secure connections
  // by forcing the use of TLS 1.2
  // see: http://kb.mozillazine.org/Security.tls.version.*#Possible_values_and_their_effects
  prefs.setPref(PREF_TLS_MIN, 3);
  prefs.setPref(PREF_TLS_MAX, 3);
}

var teardownModule = function(aModule) {
  // Reset the security preferences
  prefs.clearUserPref(PREF_TLS_MIN);
  prefs.clearUserPref(PREF_TLS_MAX);
}

/**
 * Test that setting an unsupported security protocol version returns an error page
 */
var testDisableSSL = function() {
  // Open the test page
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Verify "Secure Connection Failed" error page title
  var title = new elementslib.ID(controller.tabs.activeTab, "errorTitleText");
  controller.waitForElement(title);

  var nssFailure2title = utils.getEntity(DTDS, "nssFailure2.title");
  expect.equal(title.getNode().textContent, nssFailure2title,
               "The correct SSL error title is shown");

  // Verify "Try Again" button appears
  var tryAgain = new elementslib.ID(controller.tabs.activeTab, "errorTryAgain");
  expect.ok(tryAgain.exists(), "'Try again' button has been found");

  // Verify the error message is correct
  var shortDescription = new elementslib.ID(controller.tabs.activeTab, "errorShortDescText");
  expect.contain(shortDescription.getNode().textContent, "ssl_error_unsupported_version",
               "The SSL error message contains disabled information");
  expect.contain(shortDescription.getNode().textContent, 'mozqa.com',
                 "The SSL error message contains the domain name");
}
