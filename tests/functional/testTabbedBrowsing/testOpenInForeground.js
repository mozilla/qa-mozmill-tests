/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { assert } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + "tabbedbrowsing/openinnewtab.html";

const PREF_TAB_LOAD_IN_BACKGROUND = "browser.tabs.loadInBackground";

var gTabOrder = [
  {index: 1, linkid: 3},
  {index: 2, linkid: 2},
  {index: 3, linkid: 1}
];

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();

  prefs.preferences.setPref(PREF_TAB_LOAD_IN_BACKGROUND, false);
}

var teardownModule = function()
{
  prefs.preferences.clearUserPref(PREF_TAB_LOAD_IN_BACKGROUND);
  utils.closeContentAreaContextMenu(controller);
  tabBrowser.closeAllTabs();
}

var testOpenInForegroundTab = function()
{
  // Open the HTML testcase:
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  for(var i = 0; i < 3; i++) {
    // Switch to the first tab:
    tabBrowser.selectedIndex = 0;

    // Reference to the current link in the testcase:
    var currentLink = new elementslib.Name(controller.tabs.activeTab, "link_" + (i + 1));
    var contextMenuItem = new elementslib.ID(controller.window.document, "context-openlinkintab");

    if(i == 2) {
      // Open another tab by middle-clicking on the link
      tabBrowser.openInNewTab(currentLink);
    } else {
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

  for each(tab in gTabOrder) {
    var linkId = new elementslib.ID(controller.tabs.getTab(tab.index), "id");
    controller.waitForElement(linkId);
    assert.equal(linkId.getNode().textContent, tab.linkid.toString(),
                 "Order of tabs is correct");
  }

  // Click the close button of the second tab
  tabBrowser.selectedIndex = 1;
  tabBrowser.closeTab("closeButton");

  // Verify that we have 3 tabs now and the first tab is selected:
  assert.waitFor(function () {
    return tabBrowser.length === 3;
  }, "3 tabs have been opened");

  assert.waitFor(function () {
    return tabBrowser.selectedIndex === 0;
  }, "The first tab has been selected");
}

/**
 * Map test functions to litmus tests
 */
// testOpenInForegroundTab.meta = {litmusids : [8088]};
