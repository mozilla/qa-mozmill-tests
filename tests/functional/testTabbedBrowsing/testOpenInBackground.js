/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + "tabbedbrowsing/openinnewtab.html";

const TAB_ORDER = [
  {index: 1, linkid: 2},
  {index: 2, linkid: 3},
  {index: 3, linkid: 1}
];

var setupModule = function(module) {
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();
}

var teardownModule = function() {
  utils.closeContentAreaContextMenu(controller);
  tabBrowser.closeAllTabs();
}

var testOpenInBackgroundTab = function() {
  // Open the HTML testcase:
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  for (var i = 0; i < TAB_ORDER.length; i++) {
    // Reference to the current link in the testcase:
    var currentLink = new elementslib.Name(controller.tabs.activeTab, "link_" + (i + 1));

    if (i == 2) {
      // Open another tab by middle-clicking on the link
      tabBrowser.openInNewTab(currentLink);
    } else {
      // Open the first link via context menu in a new tab:
      tabBrowser.openInNewTab(currentLink, "contextMenu");
    }

    // Check that i+1 tabs are open and the first tab is selected
    controller.waitFor(function () {
      return tabBrowser.length === (i + 2);
    }, i + 2 + " tabs have been opened");

    controller.waitFor(function () {
      return tabBrowser.selectedIndex === 0;
    }, "First tab has been selected");

    if(i == 0) {
      // Switch to the newly opened tab and back to the first tab
      tabBrowser.selectedIndex = 1;
      tabBrowser.selectedIndex = 0;
    }
  }

  // Verify that the order of tabs is correct
  for each(var tab in TAB_ORDER) {
    var linkId = new elementslib.ID(controller.tabs.getTab(tab.index), "id");
    controller.waitForElement(linkId);
    controller.assertText(linkId, tab.linkid);
  }

  // Click the close button of the last tab
  tabBrowser.selectedIndex = 3;
  tabBrowser.closeTab("closeButton");

  // Verify that the last tab is selected:
  controller.waitFor(function () {
    return tabBrowser.length === 3;
  }, "A tab has been closed via the close button");

  controller.waitFor(function () {
    return tabBrowser.selectedIndex === 2;
  }, "The last tab has been selected");
}

/**
 * Map test functions to litmus tests
 */
// testOpenInBackgroundTab.meta = {litmusids : [8087]};
