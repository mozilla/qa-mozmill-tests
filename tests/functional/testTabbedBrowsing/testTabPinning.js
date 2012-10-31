/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {assert} = require("../../../lib/assertions");
var tabs = require("../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

function setupModule(module) {
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);
}

function teardownModule(module) {
  tabBrowser.closeAllTabs();
}

/**
 * Tests pinning and unpinning a tab successfully in a single window
 */
function testTabPinning() {
  //open a new Tab, load a Test Page and wait for it to load
  tabBrowser.openTab();

  tabBrowser.controller.open(LOCAL_TEST_PAGE);
  tabBrowser.controller.waitForPageLoad();

  var contextMenu = tabBrowser.controller.getMenu("#tabContextMenu");
  var currentTab = tabBrowser.getTab(tabBrowser.length - 1);
  contextMenu.select("#context_pinTab", currentTab);

  var appTabPinned = tabBrowser.isAppTab(currentTab);
  assert.ok(appTabPinned, "Current tab has been pinned");

  contextMenu.select("#context_unpinTab", currentTab);

  var appTabUnpinned = !tabBrowser.isAppTab(currentTab);
  assert.ok(appTabUnpinned, "Current tab has been unpinned");
}
