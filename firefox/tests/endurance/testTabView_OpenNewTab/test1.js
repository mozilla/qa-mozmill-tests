/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var endurance = require("../../../../lib/endurance");
var tabs = require("../../../lib/tabs");
var tabView = require("../../../lib/tabview");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

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
 * Test opening new tabs from the Panorama view
 **/
function testOpenNewTab() {
  enduranceManager.run(function () {
    enduranceManager.loop(function () {
      // Load a web page
      enduranceManager.addCheckpoint("Load a web page");
      controller.open(TEST_DATA);
      controller.waitForPageLoad();
      enduranceManager.addCheckpoint("Web page has been loaded");

      // Open a new tab via Panorama
      activeTabView.open();
      enduranceManager.addCheckpoint("Open a new tab from within the Tab Groups view");
      activeTabView.openTab();
      enduranceManager.addCheckpoint("New tab has been opened");
    });
    // Close all tabs
    tabBrowser.closeAllTabs();
  });
}
