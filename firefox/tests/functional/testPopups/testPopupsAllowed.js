/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { assert, expect } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "popups/popup_trigger.html?count=2";

const PREF_POPUP_BLOCK = "dom.disable_open_during_load";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.tabBrowser.closeAllTabs();

  prefs.setPref(PREF_POPUP_BLOCK, false);
}

var teardownModule = function(aModule) {
  // Reset the pop-up blocking pref
  prefs.clearUserPref(PREF_POPUP_BLOCK);

  for each (var window in mozmill.utils.getWindows("navigator:browser")) {
    if (!window.toolbar.visible)
      window.close();
  }
}

/**
 * Test to make sure pop-ups are not blocked
 *
 */
var testPopUpAllowed = function() {
  var windowCount = mozmill.utils.getWindows().length;

  // Open the Pop-up test site
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // A notification bar always exists in the DOM so check the visibility of the X button
  var button = tabBrowser.getTabPanelElement(tabBrowser.selectedIndex,
                                             '/{"value":"popup-blocked"}/anon({"type":"warning"})' +
                                             '/{"class":"messageCloseButton tabbable"}');
  assert.ok(!button.exists(), "The X button has been found");

  expect.notEqual(windowCount, mozmill.utils.getWindows().length,
                  "The window count has changed");
}
