/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var endurance = require("../../../lib/endurance");
var tabs = require("../../../lib/tabs");
var tabView = require("../../../lib/tabview");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html?tab=';

function setupModule() {
  controller = mozmill.getBrowserController();
  enduranceManager = new endurance.EnduranceManager(controller);
  tabBrowser = new tabs.tabBrowser(controller);
  activeTabView = new tabView.tabView(controller);

  tabBrowser.closeAllTabs();

  //Open test pages in tabs
  for(var i = 0; i < enduranceManager.entities; i++) {
    if (i > 0) {
      tabBrowser.openTab();
    }
    controller.open(LOCAL_TEST_PAGE + i);
    controller.waitForPageLoad();
  }
}

function teardownModule() {
  activeTabView.reset();
  tabBrowser.closeAllTabs();
}

/**
 * Test opening TabView with multiple tabs
 **/
function testOpenTabViewWithTabs() {
  enduranceManager.run(function () {
    enduranceManager.addCheckpoint("Open TabView");

    activeTabView.open();
    enduranceManager.addCheckpoint("TabView has been opened");

    activeTabView.close();
    enduranceManager.addCheckpoint("TabView has been closed");
  });

  // Close all tabs
  tabBrowser.closeAllTabs();
}
