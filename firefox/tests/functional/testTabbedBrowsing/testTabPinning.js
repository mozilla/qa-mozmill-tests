/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var {assert} = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
}

function teardownModule(aModule) {
  aModule.tabBrowser.closeAllTabs();
}

/**
 * Tests pinning and unpinning a tab successfully in a single window
 */
function testTabPinning() {
  //open a new Tab, load a Test Page and wait for it to load
  tabBrowser.openTab();

  tabBrowser.controller.open(TEST_DATA);
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
