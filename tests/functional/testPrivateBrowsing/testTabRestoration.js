/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { assert, expect } = require("../../../lib/assertions");
var privateBrowsing = require("../../../lib/private-browsing");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla_contribute.html', id: 'localization'},
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla_community.html', id: 'history'}
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
 * Test that the content of all tabs (https) is reloaded when leaving PB mode
 */
var testTabRestoration = function() {
  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  // Open local pages in seperate tabs and wait for each to finish loading
  LOCAL_TEST_PAGES.forEach(function(page) {
    controller.open(page.url);
    controller.waitForPageLoad();

    var elem = new elementslib.ID(controller.tabs.activeTab, page.id);
    assert.ok(elem.exists(), "The page ID has been found");

    tabBrowser.openTab();
  });

  // Start Private Browsing
  pb.start();

  // Stop Private Browsing
  pb.stop();

  expect.equal(controller.tabs.length, (LOCAL_TEST_PAGES.length + 1),
               "All tabs have been restored");

  // Check if all pages were re-loaded and show their content
  for (var i = 0; i < LOCAL_TEST_PAGES.length; i++) {
    controller.waitForPageLoad(controller.tabs.getTab(i));

    // waitForElement is used on exit of PB mode because pages are loaded from bfcache
    var elem = new elementslib.ID(controller.tabs.getTab(i), LOCAL_TEST_PAGES[i].id);
    controller.waitForElement(elem);
    assert.ok(elem.exists(), "The page ID has been found");
  }
}

/**
 * Map test functions to litmus tests
 */
// testTabRestoration.meta = {litmusids : [9265]};
