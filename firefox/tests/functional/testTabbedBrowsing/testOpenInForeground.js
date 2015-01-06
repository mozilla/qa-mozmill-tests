/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "tabbedbrowsing/openinnewtab.html";

const PREF_TAB_LOAD_IN_BACKGROUND = "browser.tabs.loadInBackground";

var gTabOrder = [
  {index: 1, linkid: 3},
  {index: 2, linkid: 2},
  {index: 3, linkid: 1}
];

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.tabBrowser.closeAllTabs();

  prefs.setPref(PREF_TAB_LOAD_IN_BACKGROUND, false);
}

var teardownModule = function(aModule) {
  prefs.clearUserPref(PREF_TAB_LOAD_IN_BACKGROUND);
  utils.closeContentAreaContextMenu(aModule.controller);
  aModule.tabBrowser.closeAllTabs();
}

var testOpenInForegroundTab = function() {
  // Open the HTML testcase:
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  for(var i = 0; i < 3; i++) {
    // Switch to the first tab:
    tabBrowser.selectedIndex = 0;

    // Reference to the current link in the testcase:
    var currentLink = new elementslib.Name(controller.tabs.activeTab, "link_" + (i + 1));
    var contextMenuItem = new elementslib.ID(controller.window.document, "context-openlinkintab");

    if(i == 2) {
      // Open another tab by middle-clicking on the link
      tabBrowser.openTab({method: "middleClick", target: currentLink});
    }
    else {
      // Open the context menu and open a new tab
      controller.rightClick(currentLink);
      controller.click(contextMenuItem);
      utils.closeContentAreaContextMenu(controller);
    }

    // Let's see if we have the right number of tabs open and that the first opened tab is selected
    assert.waitFor(function () {
      return tabBrowser.length === (i + 2);
    }, (i + 2) + " tabs have been opened");

    assert.waitFor(function () {
      return tabBrowser.selectedIndex === 1;
    }, "The first opened tab has been selected");
  }

  for each (var tab in gTabOrder) {
    var linkId = new elementslib.ID(controller.tabs.getTab(tab.index), "id");
    controller.waitForElement(linkId);
    assert.equal(linkId.getNode().textContent, tab.linkid.toString(),
                 "Order of tabs is correct");
  }

  // Click the close button of the second tab
  tabBrowser.selectedIndex = 1;
  tabBrowser.closeTab({method: "button"});

  // Verify that we have 3 tabs now and the first tab is selected:
  assert.waitFor(function () {
    return tabBrowser.length === 3;
  }, "3 tabs have been opened");

  assert.waitFor(function () {
    return tabBrowser.selectedIndex === 0;
  }, "The first tab has been selected");
}

