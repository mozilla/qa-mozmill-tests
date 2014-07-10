/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var endurance = require("../../../../lib/endurance");
var tabs = require("../../../lib/tabs");
var tabView = require("../../../lib/tabview");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html?tab=";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.activeTabView = new tabView.tabView(aModule.controller);

  aModule.tabBrowser.closeAllTabs();

  //Open test pages in tabs
  for(var i = 0; i < aModule.enduranceManager.entities; i++) {
    if (i > 0) {
      aModule.tabBrowser.openTab();
    }
    aModule.controller.open(TEST_DATA + i);
    aModule.controller.waitForPageLoad();
  }
}

function teardownModule(aModule) {
  aModule.activeTabView.reset();
  aModule.tabBrowser.closeAllTabs();
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
