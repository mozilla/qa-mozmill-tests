/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { expect } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var privateBrowsing = require("../../../lib/private-browsing");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource("../../../data/");
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + "private_browsing/about.html?";

const PREF_PRIVATE_BROWSING_SUPPORT = "app.support.baseURL";

var setupModule = function () {
  controller = mozmill.getBrowserController();

  // Create Private Browsing instance and set handler
  pb = new privateBrowsing.privateBrowsing(controller);

  prefs.preferences.setPref(PREF_PRIVATE_BROWSING_SUPPORT, LOCAL_TEST_PAGE);
}

var setupTest = function () {
  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;
}

var teardownTest = function (test) {
  pb.reset();
}

var teardownModule = function () {
  prefs.preferences.clearUserPref(PREF_PRIVATE_BROWSING_SUPPORT);
}

/**
 * Verify about:privatebrowsing in regular mode
 */
var testCheckRegularMode = function () {
  controller.open("about:privatebrowsing");
  controller.waitForPageLoad();

  // Check descriptions on the about:privatebrowsing page
  var issueDesc = utils.getEntity(pb.getDtds(), "privatebrowsingpage.issueDesc.normal");
  var statusText = new elementslib.ID(controller.tabs.activeTab, "errorShortDescTextNormal");
  controller.waitForElement(statusText);

  var statusTextContent = statusText.getNode().textContent;
  expect.equal(statusTextContent, issueDesc, "Status text indicates we are in private browsing mode");

  // Check button to enter Private Browsing mode
  var button = new elementslib.ID(controller.tabs.activeTab, "startPrivateBrowsing");
  controller.click(button);

  controller.waitFor(function () {
    return pb.enabled;
  }, "Private Browsing mode has been enabled");
}

/**
 * Verify about:privatebrowsing in private browsing mode
 */
var testCheckPrivateBrowsingMode = function () {
  // Start the Private Browsing mode
  pb.start();
  controller.waitForPageLoad();

  var moreInfo = new elementslib.ID(controller.tabs.activeTab, "moreInfoLink");
  controller.click(moreInfo);

  // Clicking on the more info link opens a new tab with a page on SUMO
  var targetUrl = LOCAL_TEST_PAGE + "private-browsing";

  controller.waitFor(function () {
    return controller.tabs.length === 2;
  }, "A new tab has been opened");

  controller.waitForPageLoad();
  utils.assertLoadedUrlEqual(controller, targetUrl);
}

/**
 * Map test functions to litmus tests
 */
// testCheckAboutPrivateBrowsing.meta = {litmusids : [9203]};

setupModule.__force_skip__ = "Bug 818456 - Investigate and prepare existing Mozmill tests" +
                             " for per window private browsing";
teardownModule.__force_skip__ = "Bug 818456 - Investigate and prepare existing Mozmill tests" +
                                " for per window private browsing";
