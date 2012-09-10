/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var endurance = require("../../../lib/endurance");
var tabs = require("../../../lib/tabs");
var tabView = require("../../../lib/tabview");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  LOCAL_TEST_FOLDER + 'layout/mozilla.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_community.html'
];

function setupModule() {
  controller = mozmill.getBrowserController();
  enduranceManager = new endurance.EnduranceManager(controller);
  tabBrowser = new tabs.tabBrowser(controller);
  activeTabView = new tabView.tabView(controller);

  tabBrowser.closeAllTabs();
}

function teardownModule() {
  activeTabView.reset();
  tabBrowser.closeAllTabs();
}

/**
 * Test switching tabs from the Tab Groups view
 **/
function testSwitchTabs() {
  // Load two pages in separate tabs before iterating
  controller.open(LOCAL_TEST_PAGES[0]);
  controller.waitForPageLoad();

  tabBrowser.openTab();

  controller.open(LOCAL_TEST_PAGES[1]);
  controller.waitForPageLoad();

  enduranceManager.run(function () {
    // Open the Tab Groups view
    enduranceManager.addCheckpoint("Open the Tab Groups view");
    activeTabView.open();
    enduranceManager.addCheckpoint("Tab Groups view now open");

    // Switch to the tab which is not active
    enduranceManager.addCheckpoint("Switch to the inactive tab");
    var activeTab = activeTabView.getTabs({filter: "active"})[0];
    var allTabs = activeTabView.getTabs();

    // Select the tab which is NOT active
    if (activeTab.getNode() === allTabs[0].getNode()) {
        activeTabView.controller.click(allTabs[1]);
    } else {
        activeTabView.controller.click(allTabs[0]);
    }

    // Wait for the selected tab to display
    activeTabView.waitForClosed();
    enduranceManager.addCheckpoint("Selected tab is now displayed");
  });
}

// Bug 684801 - Timeout failure in /testTabView_SwitchTabs/test1.js | TabView is still open.
setupModule.__force_skip__ = "Bug 684801: Timeout failure in /testTabView_SwitchTabs/test1.js " +
                             "| TabView is still open.";
teardownModule.__force_skip__ = "Bug 684801: Timeout failure in /testTabView_SwitchTabs/test1.js " +
                                "| TabView is still open.";
