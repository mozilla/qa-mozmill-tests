/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

const TEST_DATA = [
  // Phishing url
  "https://www.itisatrap.org/firefox/its-a-trap.html",
  // Malware url
  "https://www.itisatrap.org/firefox/its-an-attack.html"
];

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  // Clear the Safe Browsing permission
  utils.removePermission("www.itisatrap.org", "safe-browsing");
}

var testWarningPages = function() {
  for (var i = 0; i < TEST_DATA.length; i++ ) {
    // Load one of the safe browsing test pages
    controller.open(TEST_DATA[i]);
    controller.waitForPageLoad();

    // Test the getMeOutButton
    checkGetMeOutOfHereButton();

    // Go back to the warning page
    controller.open(TEST_DATA[i]);
    controller.waitForPageLoad();

    // Test the reportButton
    checkReportButton(i, TEST_DATA[i]);

    // Go back to the warning page
    controller.open(TEST_DATA[i]);
    controller.waitForPageLoad();

    // Test the ignoreWarning button
    checkIgnoreWarningButton(TEST_DATA[i]);
  }
}

/**
 * Check that the getMeOutButton sends the user to the firefox's default home page
 */
var checkGetMeOutOfHereButton = function() {
  var getMeOutOfHereButton = new elementslib.ID(controller.tabs.activeTab, "getMeOutButton");

  // Wait for the getMeOutOfHereButton to be safely loaded on the warning page and click it
  controller.waitThenClick(getMeOutOfHereButton);
  controller.waitForPageLoad();

  // Check that the default home page has been opened
  utils.assertLoadedUrlEqual(controller, utils.getDefaultHomepage());
}

/*
 * Check that the reportButton sends the user to the forgery or attack site reporting page
 *
 * @param {number} aType
 *        Type of malware site to check
 * @param {string} aBadUrl
 *        URL of malware site to check
 */
var checkReportButton = function(aType, aBadUrl) {
  // Wait for the reportButton to be safely loaded onto the warning page
  var reportButton = new elementslib.ID(controller.tabs.activeTab, "reportButton");
  controller.waitThenClick(reportButton);
  controller.waitForPageLoad();

  var locale = prefs.getPref("general.useragent.locale", "");
  var url = "";

  if (aType == 0) {
    // Build phishing URL be replacing identifiers with actual locale of browser
    url = utils.formatUrlPref("app.support.baseURL") + "phishing-malware";
  }
  else if (aType == 1) {
    // Build malware URL be replacing identifiers with actual locale of browser and Firefox being used
    url = utils.formatUrlPref("browser.safebrowsing.malware.reportURL") + aBadUrl;
  }

  utils.assertLoadedUrlEqual(controller, url);
}

/*
 * Check that the ignoreWarningButton goes to proper page associated to the url provided
 *
 * @param {string} aUrl
 *        URL of the target website which should be opened
 */
var checkIgnoreWarningButton = function(aUrl) {
  var ignoreWarningButton = new elementslib.ID(controller.tabs.activeTab, "ignoreWarningButton");
  var mainFeatureElem = new elementslib.ID(controller.tabs.activeTab, "main-feature");

  // Wait for the ignoreButton to be safely loaded on the warning page
  controller.waitThenClick(ignoreWarningButton);
  controller.waitForPageLoad();

  // Verify the warning button is not visible and the location bar displays the correct url
  utils.assertLoadedUrlEqual(controller, aUrl);
  assert.ok(!ignoreWarningButton.exists(), "'Ignore warning' button has not been found");
  assert.ok(mainFeatureElem.exists(), "'Main feature' element has been found");

  // Clear the Safe Browsing permission
  utils.removePermission("www.itisatrap.org", "safe-browsing");
}
