/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var endurance = require("../../../../lib/endurance");
var tabs = require("../../../lib/tabs");
var tabView = require("../../../lib/tabview");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = [
  BASE_URL + "layout/mozilla.html",
  BASE_URL + "layout/mozilla_community.html"
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.activeTabView = new tabView.tabView(aModule.controller);

  aModule.tabBrowser.closeAllTabs();
}

function teardownModule(aModule) {
  aModule.activeTabView.reset();
  aModule.tabBrowser.closeAllTabs();
}

/**
 * Test switching tabs from the Tab Groups view
 **/
function testSwitchTabs() {
  // Load two pages in separate tabs before iterating
  controller.open(TEST_DATA[0]);
  controller.waitForPageLoad();

  tabBrowser.openTab();

  controller.open(TEST_DATA[1]);
  controller.waitForPageLoad();

  enduranceManager.run(function () {
    // Open the Tab Groups view
    enduranceManager.addCheckpoint("Open the Tab Groups view");
    activeTabView.open();
    enduranceManager.addCheckpoint("Tab Groups view now open");

    // Switch to the tab which is not active under the "active group"
    enduranceManager.addCheckpoint("Switch to the inactive tab");
    var activeTab = activeTabView.getTabs({filter: "active"})[0];
    var allTabs = activeTabView.getTabs();

    // Select the tab which is NOT active under the "active group"
    if (activeTab.getNode() === allTabs[0].getNode()) {
      activeTabView.selectTabAtIndex(1, "active");
    }
    else {
      activeTabView.selectTabAtIndex(0, "active");
    }

    enduranceManager.addCheckpoint("Selected tab is now displayed");
  });
}
