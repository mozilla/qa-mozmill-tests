/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var prefs = require("../../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");
var utils = require("../../../../../lib/utils");

const PREF_BROWSER_HOME_PAGE = "browser.startup.homepage";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
}

function teardownModule(aModule) {
  delete persisted.testData;

  prefs.clearUserPref(PREF_BROWSER_HOME_PAGE);
  aModule.controller.stopApplication(true);
}

/**
 * Open history menu and select restore previous session entry
 */
function testRestorePreviousSession() {
  // Click on restore previous session menu item
  controller.mainMenu.click("#historyRestoreLastSession");

  // Check if the number of correct tabs have been opened
  assert.waitFor(() => (tabBrowser.length === persisted.testData.length),
                 "There are " + persisted.testData.length + " opened tabs");

  // Check if correct tabs have been opened
  persisted.testData.forEach((aURL, aIndex) => {
    // Wait for the expected tab to load
    let tab;
    assert.waitFor(() => !!(tab = tabs.getTabsWithURL(aURL)[0]),
                   "Tab with URL '" + aURL + "' has been opened");

    // Check for correct tab index
    assert.equal(tab.index, aIndex,
                 "The restored '" + aURL + "' tab has the correct index");
  });
}
