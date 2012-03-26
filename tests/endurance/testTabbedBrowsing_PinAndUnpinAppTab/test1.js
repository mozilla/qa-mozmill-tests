/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
// Include required modules
var tabs = require("../../../lib/tabs");
var endurance = require("../../../lib/endurance");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

function setupModule(module) {
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);
  enduranceManager = new endurance.EnduranceManager(controller);
  tabBrowser.closeAllTabs();
  
  scrollButtonDown = tabBrowser.getElement({type: "tabs_scrollButton", subtype: "down"});
}

function teardownModule(module) {
  tabBrowser.closeAllTabs();
}

/**
 * Tests pinning and unpinning app tabs
 */
function testPinAndUnpinAppTab() {
  var contextMenu = tabBrowser.controller.getMenu("#tabContextMenu");
  var currentTab = null;
  enduranceManager.run(function () {

    // Open tabs
    enduranceManager.loop(function () {
        if (enduranceManager.currentEntity > 1) {
          tabBrowser.openTab();
        }
        controller.open(LOCAL_TEST_PAGE);
        controller.waitForPageLoad();
    });

    // Pin tabs
    enduranceManager.loop(function () {
      var lastTabIndex = tabBrowser.length-1;
      
      // Switch to the last tab and wait for it to scroll into view if necessary
      controller.tabs.selectTabIndex(lastTabIndex);
      controller.waitFor(function () {
        return scrollButtonDown.getNode().hasAttribute("collapsed") || scrollButtonDown.getNode().disabled;
      }, "Tab has scrolled into view.");
      
      currentTab = tabBrowser.getTab(tabBrowser.length-1);
      enduranceManager.addCheckpoint("Pinning tab");
      contextMenu.select("#context_pinTab", currentTab);
      enduranceManager.addCheckpoint("Tab has been pinned");
    });

    // Unpin tabs
    enduranceManager.loop(function () {
      currentTab = tabBrowser.getTab(0);
      enduranceManager.addCheckpoint("Unpinning tab");
      contextMenu.select("#context_unpinTab", currentTab);
      enduranceManager.addCheckpoint("Tab has been unpinned");
    });

    // Close all tabs
    tabBrowser.closeAllTabs();
  });
}
