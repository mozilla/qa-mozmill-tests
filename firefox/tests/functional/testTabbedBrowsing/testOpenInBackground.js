/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "tabbedbrowsing/openinnewtab.html";

const TAB_ORDER = [
  {index: 1, linkid: 2},
  {index: 2, linkid: 3},
  {index: 3, linkid: 1}
];

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.tabBrowser.closeAllTabs();
}

var teardownModule = function(aModule) {
  utils.closeContentAreaContextMenu(aModule.controller);
  aModule.tabBrowser.closeAllTabs();
}

var testOpenInBackgroundTab = function() {
  // Open the HTML testcase:
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  for (var i = 0; i < TAB_ORDER.length; i++) {
    // Reference to the current link in the testcase:
    var currentLink = new elementslib.Name(controller.tabs.activeTab, "link_" + (i + 1));

    if (i == 2) {
      // Open another tab by middle-clicking on the link
      tabBrowser.openTab({method: "middleClick", target: currentLink});
    }
    else {
      // Open the first link via context menu in a new tab:
      tabBrowser.openTab({method: "contextMenu", target: currentLink});
    }

    // Check that i+1 tabs are open and the first tab is selected
    assert.waitFor(function () {
      return tabBrowser.length === (i + 2);
    }, i + 2 + " tabs have been opened");

    assert.waitFor(function () {
      return tabBrowser.selectedIndex === 0;
    }, "First tab has been selected");

    if(i == 0) {
      // Switch to the newly opened tab and back to the first tab
      tabBrowser.selectedIndex = 1;
      tabBrowser.selectedIndex = 0;
    }
  }

  for each(var tab in TAB_ORDER) {
    var linkId = new elementslib.ID(controller.tabs.getTab(tab.index), "id");
    controller.waitForElement(linkId);
    assert.equal(linkId.getNode().textContent, tab.linkid.toString(),
                 "Order of tabs is correct");
  }

  // Click the close button of the last tab
  tabBrowser.selectedIndex = 3;
  tabBrowser.closeTab({method: "button"});

  // Verify that the last tab is selected:
  assert.waitFor(function () {
    return tabBrowser.length === 3;
  }, "A tab has been closed via the close button");

  assert.waitFor(function () {
    return tabBrowser.selectedIndex === 2;
  }, "The last tab has been selected");
}

