/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// Include necessary modules
var {assert, expect} = require("../../../lib/assertions");
var sessionStore = require("../../../lib/sessionstore");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER +
                        "tabbedbrowsing/openinnewtab_target.html?id=";

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);

  tabBrowser.closeAllTabs();
  sessionStore.resetRecentlyClosedTabs();
}

var teardownModule = function(module) {
  utils.closeContentAreaContextMenu(controller);
  sessionStore.resetRecentlyClosedTabs();
  tabBrowser.closeAllTabs();
}

var testUndoTabFromContextMenu = function() {
  // Open the tab browser context menu on the current tab
  var currentTab = tabBrowser.getTab();
  controller.rightClick(currentTab);

  var contextMenuItem = new elementslib.ID(controller.window.document, 'context_undoCloseTab');
  expect.ok(contextMenuItem.getNode().disabled, "Undo Close Tab is disabled");
  utils.closeContentAreaContextMenu(controller);

  // Check 'Recently Closed Tabs' count, should be 0
  var tabCount = sessionStore.getClosedTabCount(controller);
  assert.equal(tabCount, 0, "'Recently Closed Tabs' sub menu has to be empty");

  // Open 3 tabs with pages in the local test folder
  for (var i = 0; i < 3; i++) {
   controller.open(LOCAL_TEST_PAGE + i);
   controller.waitForPageLoad();
   tabBrowser.openTab();
  }

  // Close 2nd tab via File > Close tab:
  tabBrowser.selectedIndex = 1;
  tabBrowser.closeTab();

  // Check for correct id on 2nd tab, should be 2
  var linkId = new elementslib.ID(controller.tabs.activeTab, "id");
  controller.assertText(linkId, "2");

  // Check 'Recently Closed Tabs' count, should be 1
  tabCount = sessionStore.getClosedTabCount(controller);
  assert.equal(tabCount, 1, "'Recently Closed Tabs' sub menu has one entry");

  controller.rightClick(currentTab);
  expect.ok(!contextMenuItem.getNode().disabled, "Undo Close Tab is enabled");

  // Restore recently closed tab via tab browser context menu'
  controller.click(contextMenuItem);
  controller.waitForPageLoad();
  utils.closeContentAreaContextMenu(controller);

  // Check for correct id on 2nd tab, should be 1
  linkId = new elementslib.ID(controller.tabs.activeTab, "id");
  controller.assertText(linkId, "1");

  // Check 'Recently Closed Tabs' count, should be 0
  tabCount = sessionStore.getClosedTabCount(controller);
  assert.equal(tabCount, 0, "'Recently Closed Tabs' sub menu has one entry");

  controller.rightClick(currentTab);
  assert.ok(contextMenuItem.getNode().disabled, "Undo Close Tab is disabled");
  utils.closeContentAreaContextMenu(controller);
}
