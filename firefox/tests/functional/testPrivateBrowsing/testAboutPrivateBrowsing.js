/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { assert, expect } = require("../../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var privateBrowsing = require("../../../lib/ui/private-browsing");
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "private_browsing/about.html?";

const PREF_PRIVATE_BROWSING_SUPPORT = "app.support.baseURL";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.pbWindow = new privateBrowsing.PrivateBrowsingWindow();

  prefs.preferences.setPref(PREF_PRIVATE_BROWSING_SUPPORT, TEST_DATA);
}

function teardownModule(aModule) {
  prefs.preferences.clearUserPref(PREF_PRIVATE_BROWSING_SUPPORT);
  aModule.pbWindow.close();
}

/**
 * Verify about:privatebrowsing
 */
function testCheckAboutPrivateBrowsing() {
  controller.open("about:privatebrowsing");
  controller.waitForPageLoad();

  // Check descriptions on the about:privatebrowsing page
  var issueDesc = utils.getEntity(pbWindow.getDtds(),
                                  "privatebrowsingpage.perwindow.issueDesc.normal");
  var statusText = new elementslib.ID(controller.tabs.activeTab, "errorShortDescTextNormal");
  controller.waitForElement(statusText);

  var statusTextContent = statusText.getNode().textContent;
  expect.equal(statusTextContent, issueDesc, "Status text indicates we are in private browsing mode");

  pbWindow.open(controller, "callback", function () {
    var button = new elementslib.ID(controller.tabs.activeTab, "startPrivateBrowsing");
    controller.click(button);
  });

  var moreInfo = new elementslib.ID(pbWindow.controller.tabs.activeTab, "moreInfoLink");
  pbWindow.controller.click(moreInfo);

  // Clicking on the more info link opens a new tab with a page on SUMO
  var targetUrl = TEST_DATA + "private-browsing";

  assert.waitFor(function () {
    return pbWindow.controller.tabs.length === 2;
  }, "A new tab has been opened");

  pbWindow.controller.waitForPageLoad();
  utils.assertLoadedUrlEqual(pbWindow.controller, targetUrl);
}
