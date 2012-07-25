/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { expect } = require("../../../lib/assertions");
var privateBrowsing = require("../../../lib/private-browsing");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla.html', id: 'organization'},
  {url: 'about:', id: 'aboutPageList'}
];

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  pb = new privateBrowsing.privateBrowsing(controller);

  tabBrowser = new tabs.tabBrowser(controller);  
  tabBrowser.closeAllTabs();
}

var teardownModule = function(module) {
  pb.reset();
}

/**
 * Test that the content of all tabs (http, https, about), which were loaded
 * before the transistion into PB mode, is re-loaded when leaving PB mode
 */
var testAllTabsClosedOnStop = function() {
  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  // Start Private Browsing
  pb.start();

  // Open local pages in seperate tabs and wait for each to finish loading
  LOCAL_TEST_PAGES.forEach(function(page) { 
    controller.open(page.url);
    controller.waitForPageLoad();
    
    var elem = new elementslib.ID(controller.tabs.activeTab, page.id);
    controller.assertNode(elem);
    
    tabBrowser.openTab();
  });

  // Stop Private Browsing
  pb.stop();

  expect.equal(controller.tabs.length, 1, "All tabs have been removed");
}

/**
 * Map test functions to litmus tests
 */
// testAllTabsClosedOnStop.meta = {litmusids : [9317]};
