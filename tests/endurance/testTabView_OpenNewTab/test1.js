/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var endurance = require("../../../lib/endurance");
var tabs = require("../../../lib/tabs");
var tabView = require("../../../lib/tabview");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

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
 * Test opening new tabs from the Panorama view
 **/
function testOpenNewTab() {
  enduranceManager.run(function () {
    enduranceManager.loop(function () {
      // Load a web page
      enduranceManager.addCheckpoint("Load a web page");
      controller.open(LOCAL_TEST_PAGE);
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
