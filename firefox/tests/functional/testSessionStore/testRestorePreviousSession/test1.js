/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var prefs = require("../../../../../lib/prefs");
var sessionstore = require("../../../../lib/sessionstore");
var tabs = require("../../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../../data/");
const TEST_DATA = [
  BASE_URL + "layout/mozilla.html",
  BASE_URL + "layout/mozilla_projects.html",
  BASE_URL + "layout/mozilla_organizations.html",
];

const PREF_BROWSER_HOME_PAGE = "browser.startup.homepage";

function setupModule(aModule) {

  // Bug 1097064
  // We set the default homepage to about:home so the restored tabs will
  // overwrite the default opened one
  prefs.setPref(PREF_BROWSER_HOME_PAGE, "about:home");

  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.tabBrowser.closeAllTabs();

  persisted.testData = TEST_DATA;
}

function teardownModule(aModule) {
  aModule.controller.stopApplication();
}

/**
 * Open three webpages in different tabs
 */
function testOpenTabs() {
  controller.open(TEST_DATA[0]);
  controller.waitForPageLoad();
  openTabWithUrl(TEST_DATA[1]);

  // Open the third tab and wait for session to be written to disk
  sessionstore.waitForSessionSaved(() => {
    openTabWithUrl(TEST_DATA[2]);
  });

  // Check for correct number of opened tabs
  assert.equal(tabBrowser.length, TEST_DATA.length,
               "There are " + TEST_DATA.length + " opened tabs");

  // Check if correct tabs have been opened
  TEST_DATA.forEach((aURL, aIndex) => {
    assert.ok(controller.tabs.getTabWindow(aIndex).location.toString() === aURL,
              "Tab with URL '" + aURL + "' has been opened");
  });
}

/**
 * Open a new tab and navigate to a specific page
 *
 * @param {string} aURL
 *        Url of the page to navigate to
 */
function openTabWithUrl(aURL) {
  tabBrowser.openTab();
  controller.open(aURL);
  controller.waitForPageLoad();
}
