/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");


const gDelay = 0;
const gTimeout = 5000;

const DOMAIN_NAME = "www.mozilla.org";

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();

  tabs.closeAllTabs(controller);
}

function teardownModule(module) {
  // Clear the Safe Browsing permission
  utils.removePermission(DOMAIN_NAME, "safe-browsing");
}

var testWarningPages = function() {
  var urls = ['http://' + DOMAIN_NAME + '/firefox/its-a-trap.html',
              'http://' + DOMAIN_NAME + '/firefox/its-an-attack.html'];

  for (var i = 0; i < urls.length; i++ ) {
    // Open one of the mozilla phishing protection test pages
    controller.open(urls[i]);
    controller.waitForPageLoad();

    // Test the getMeOutButton
    checkGetMeOutOfHereButton();

    // Go back to the warning page
    controller.open(urls[i]);
    controller.waitForPageLoad();

    // Test the reportButton
    checkReportButton(i, urls[i]);

    // Go back to the warning page
    controller.open(urls[i]);
    controller.waitForPageLoad();

    // Test the ignoreWarning button
    checkIgnoreWarningButton(urls[i]);
  }
}

/**
 * Check that the getMeOutButton sends the user to the firefox's default home page
 */
var checkGetMeOutOfHereButton = function()
{
  var getMeOutOfHereButton = new elementslib.ID(controller.tabs.activeTab, "getMeOutButton");

  // Wait for the getMeOutOfHereButton to be safely loaded on the warning page and click it
  controller.waitThenClick(getMeOutOfHereButton, gTimeout);
  controller.waitForPageLoad();

  // Check that the default home page has been opened
  utils.assertLoadedUrlEqual(controller, utils.getDefaultHomepage());
}

/*
 * Check that the reportButton sends the user to the forgery or attack site reporting page
 *
 * @param {number} type
 *        Type of malware site to check
 * @param {string} badUrl
 *        URL of malware site to check
 */
var checkReportButton = function(type, badUrl) {
  // Wait for the reportButton to be safely loaded onto the warning page
  var reportButton = new elementslib.ID(controller.tabs.activeTab, "reportButton");
  controller.waitThenClick(reportButton, gTimeout);
  controller.waitForPageLoad();

  var locale = prefs.preferences.getPref("general.useragent.locale", "");
  var url = "";

  if (type == 0) {
    // Build phishing URL be replacing identifiers with actual locale of browser
    url = utils.formatUrlPref("browser.safebrowsing.warning.infoURL");

    var phishingElement = new elementslib.ID(controller.tabs.activeTab, "phishing-protection")
    controller.assertNode(phishingElement);

  } else if (type == 1) {
    // Build malware URL be replacing identifiers with actual locale of browser and Firefox being used
    url = utils.formatUrlPref("browser.safebrowsing.malware.reportURL") + badUrl;

    var malwareElement = new elementslib.ID(controller.tabs.activeTab, "date");
    controller.assertNode(malwareElement);
  }

  utils.assertLoadedUrlEqual(controller, url);
}

/*
 * Check that the ignoreWarningButton goes to proper page associated to the url provided
 *
 * @param {string} url
 *        URL of the target website which should be opened
 */
var checkIgnoreWarningButton = function(url) {
  var ignoreWarningButton = new elementslib.ID(controller.tabs.activeTab, "ignoreWarningButton");

  // Wait for the ignoreButton to be safely loaded on the warning page
  controller.waitThenClick(ignoreWarningButton, gTimeout);
  controller.waitForPageLoad();

  // Verify the warning button is not visible and the location bar displays the correct url
  utils.assertLoadedUrlEqual(controller, url);
  controller.assertNodeNotExist(ignoreWarningButton);
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "main-feature"));

  // Clear the Safe Browsing permission
  utils.removePermission(DOMAIN_NAME, "safe-browsing");
}

/**
 * Map test functions to litmus tests
 */
// testWarningPages.meta = {litmusids : [9014]};
