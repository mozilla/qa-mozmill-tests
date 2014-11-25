/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var endurance = require("../../../../lib/endurance");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

const SCROLL_DELAY = "toolkit.scrollbox.clickToScroll.scrollDelay";
const SCROLL_SMOOTH = "toolkit.scrollbox.smoothScroll";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);
  aModule.tabBrowser.closeAllTabs();

  prefs.setPref(SCROLL_DELAY, 0);
  prefs.setPref(SCROLL_SMOOTH, false);

  aModule.scrollButtonDown = aModule.tabBrowser.getElement({type: "tabs_scrollButton", subtype: "down"});
}

function teardownModule(aModule) {
  prefs.clearUserPref(SCROLL_DELAY);
  prefs.clearUserPref(SCROLL_SMOOTH);

  aModule.tabBrowser.closeAllTabs();
}

/**
 * Tests pinning and unpinning app tabs
 */
function testPinAndUnpinAppTab() {
  var currentTab = null;
  enduranceManager.run(function () {

    // Open tabs
    enduranceManager.loop(function () {
      if (enduranceManager.currentEntity > 1) {
        tabBrowser.openTab();
      }
      controller.open(TEST_DATA);
      controller.waitForPageLoad();
    });

    // Pin tabs
    enduranceManager.loop(function () {
      var lastTabIndex = tabBrowser.length-1;

      // Switch to the last tab and wait for it to scroll into view if necessary
      controller.tabs.selectTabIndex(lastTabIndex);
      assert.waitFor(function () {
        return scrollButtonDown.getNode().hasAttribute("collapsed") ||
               scrollButtonDown.getNode().disabled;
      }, "Tab has scrolled into view.");

      currentTab = tabBrowser.getTab(lastTabIndex);
      enduranceManager.addCheckpoint("Pinning tab");
      tabBrowser.pinTab(currentTab);
      enduranceManager.addCheckpoint("Tab has been pinned");
    });

    // Unpin tabs
    enduranceManager.loop(function () {
      currentTab = tabBrowser.getTab(0);
      enduranceManager.addCheckpoint("Unpinning tab");
      tabBrowser.unpinTab(currentTab);
      enduranceManager.addCheckpoint("Tab has been unpinned");
    });

    // Close all tabs
    tabBrowser.closeAllTabs();
  });
}
