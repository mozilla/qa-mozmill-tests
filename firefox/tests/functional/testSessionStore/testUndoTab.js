/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var sessionStore = require("../../../lib/sessionstore");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "tabbedbrowsing/openinnewtab_target.html?id=";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();
  sessionStore.resetRecentlyClosedTabs();
}

function setupTest(aModule) {
  // Open 3 tabs with pages in the local test folder
  for (var i = 0; i < 3; i++) {
    aModule.controller.open(TEST_DATA + i);
    aModule.controller.waitForPageLoad();
    aModule.tabBrowser.openTab();
  }
}

function teardownTest(aModule) {
  aModule.tabBrowser.closeAllTabs();
  sessionStore.resetRecentlyClosedTabs();
  utils.closeContentAreaContextMenu(aModule.controller);
}

/**
 * Test 'Undo Close Tab' via context menu
 */
function testUndoTabFromContextMenu() {
  // Open the tab browser context menu on the current tab
  var contextMenu = controller.getMenu("#tabContextMenu");
  contextMenu.open(tabBrowser.getTab());
  var contextMenuItem = contextMenu.getItem("#context_undoCloseTab");

  // Check that 'Undo Close Tab' is disabled
  expect.ok(contextMenuItem.getNode().disabled, "'Undo Close Tab' is disabled");
  contextMenu.close();

  // Check 'Recently Closed Tabs' count, should be 0
  var tabCount = sessionStore.getClosedTabCount(controller);
  assert.equal(tabCount, 0, "'Recently Closed Tabs' sub menu has to be empty");

  // Close 2nd tab via File > Close tab:
  tabBrowser.selectedIndex = 1;
  tabBrowser.closeTab();

  // Check for correct id on 2nd tab, should be 2
  var linkId = new elementslib.ID(controller.tabs.activeTab, "id");
  expect.equal(linkId.getNode().textContent, "2", "Second tab has correct id");

  // Check 'Recently Closed Tabs' count, should be 1
  tabCount = sessionStore.getClosedTabCount(controller);
  assert.equal(tabCount, 1, "'Recently Closed Tabs' sub menu has one entry");

  // Restore recently closed tab via context menu
  tabBrowser.reopen("contextMenu");
  controller.waitForPageLoad();

  contextMenu.open(tabBrowser.getTab());
  assert.ok(contextMenuItem.getNode().disabled, "'Undo Close Tab' is disabled");
  contextMenu.close();

  // Check for correct id on 2nd tab, should be 1
  linkId = new elementslib.ID(controller.tabs.activeTab, "id");
  expect.equal(linkId.getNode().textContent, "1", "Second tab has correct id");

  // Check 'Recently Closed Tabs' count, should be 0
  tabCount = sessionStore.getClosedTabCount(controller);
  assert.equal(tabCount, 0, "'Recently Closed Tabs' sub menu has one entry");

}

/**
 * Bug 969303: Test 'Undo Close Tab' via shortcut
 */
function testUndoTabViaShortcut() {
  // Close 2nd tab via File > Close tab:
  tabBrowser.selectedIndex = 1;
  tabBrowser.closeTab();

  // Check for correct id on 2nd tab, should be 2
  var linkId = new elementslib.ID(controller.tabs.activeTab, "id");
  expect.equal(linkId.getNode().textContent, "2", "Second tab has correct id");

  // Restore recently closed tab via shortcut
  tabBrowser.reopen("shortcut");
  controller.waitForPageLoad();

  // Check for correct id on 2nd tab, should be 1
  var linkId = new elementslib.ID(controller.tabs.activeTab, "id");
  expect.equal(linkId.getNode().textContent, "1", "Second tab has correct id");

  // Check 'Recently Closed Tabs' count, should be 0
  var tabCount = sessionStore.getClosedTabCount(controller);
  assert.equal(tabCount, 0, "'Recently Closed Tabs' sub menu has one entry");

}

/**
 * Bug 969303: Test 'Undo Close Tab' via main-menu
 */
function testUndoTabViaMainMenu() {
  // Close 2nd tab via File > Close tab:
  tabBrowser.selectedIndex = 1;
  tabBrowser.closeTab();

  // Check for correct id on 2nd tab, should be 2
  var linkId = new elementslib.ID(controller.tabs.activeTab, "id");
  expect.equal(linkId.getNode().textContent, "2", "Second tab has correct id");

  // Restore recently closed tab via shortcut
  tabBrowser.reopen("mainMenu");
  controller.waitForPageLoad();

  // Check for correct id on 2nd tab, should be 1
  var linkId = new elementslib.ID(controller.tabs.activeTab, "id");
  expect.equal(linkId.getNode().textContent, "1", "Second tab has correct id");

  // Check 'Recently Closed Tabs' count, should be 0
  var tabCount = sessionStore.getClosedTabCount(controller);
  assert.equal(tabCount, 0, "'Recently Closed Tabs' sub menu has one entry");

}
