/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var privateBrowsing = require("../../../lib/private-browsing");
var utils = require("../../../lib/utils");

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  // Create Private Browsing instance and set handler
  pb = new privateBrowsing.privateBrowsing(controller);
}

var setupTest = function(module)
{
  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;
}

var teardownTest = function(test)
{
  pb.reset();
}

/**
 * Verify about:privatebrowsing in regular mode
 */
var testCheckRegularMode = function()
{
  controller.open("about:privatebrowsing");
  controller.waitForPageLoad();
  
  // Check descriptions on the about:privatebrowsing page
  var issueDesc = utils.getEntity(pb.getDtds(), "privatebrowsingpage.issueDesc.normal");
  var statusText = new elementslib.ID(controller.tabs.activeTab, "errorShortDescTextNormal");
  controller.waitForElement(statusText, gTimeout);
  controller.assertText(statusText, issueDesc);
  
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
var testCheckPrivateBrowsingMode = function()
{
  // Start the Private Browsing mode
  pb.start();
  controller.waitForPageLoad();

  var moreInfo = new elementslib.ID(controller.tabs.activeTab, "moreInfoLink");
  controller.click(moreInfo);

  // Clicking on the more info link opens a new tab with a page on SUMO
  var targetUrl = utils.formatUrlPref("app.support.baseURL") + "private-browsing";

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
