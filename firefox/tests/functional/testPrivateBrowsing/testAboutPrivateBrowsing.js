/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { assert, expect } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");
var windows = require("../../../../lib/windows");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "private_browsing/about.html?";

const PREF_PRIVATE_BROWSING_SUPPORT = "app.support.baseURL";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.browserWindow = new browser.BrowserWindow();

  prefs.setPref(PREF_PRIVATE_BROWSING_SUPPORT, TEST_DATA);
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_PRIVATE_BROWSING_SUPPORT);
  windows.closeAllWindows(aModule.browserWindow);
}

/**
 * Verify about:privatebrowsing
 */
function testCheckAboutPrivateBrowsing() {
  controller.open("about:privatebrowsing");
  controller.waitForPageLoad();

  // Check descriptions on the about:privatebrowsing page
  var issueDesc = browserWindow.getEntity("aboutPrivateBrowsing.subtitle.normal");
  var statusText = findElement.Selector(controller.tabs.activeTab, "p.showNormal");
  controller.waitForElement(statusText);

  var statusTextContent = statusText.getNode().textContent;
  expect.equal(statusTextContent, issueDesc, "Status text indicates we are in private browsing mode");

  var pbWindow = browserWindow.open({private: true, method: "callback"}, () => {
    var button = findElement.Selector(controller.tabs.activeTab,
                                      "button.showNormal");
    button.click();
  });

  var moreInfo = new findElement.ID(pbWindow.controller.tabs.activeTab, "learnMore");
  pbWindow.controller.click(moreInfo);

  // Clicking on the more info link opens a new tab with a page on SUMO
  var targetUrl = TEST_DATA + "private-browsing";

  assert.waitFor(function () {
    return pbWindow.controller.tabs.length === 2;
  }, "A new tab has been opened");

  pbWindow.controller.waitForPageLoad();
  utils.assertLoadedUrlEqual(pbWindow.controller, targetUrl);
}
