/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { expect } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "popups/popup_trigger.html?count=2";

const PREF_POPUP_BLOCK = "dom.disable_open_during_load";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  prefs.setPref(PREF_POPUP_BLOCK, true);
}

var teardownModule = function(aModule) {
  // Reset the pop-up blocking pref and close all open tabs
  prefs.clearUserPref(PREF_POPUP_BLOCK);
  aModule.tabBrowser.closeAllTabs();

  for each (var window in mozmill.utils.getWindows("navigator:browser")) {
    if (!window.toolbar.visible)
      window.close();
  }
}

/**
 * Test to make sure pop-ups are blocked
 *
 */
var testPopUpBlocked = function() {
  var windowCount = mozmill.utils.getWindows().length;

  tabBrowser.waitForTabPanel(tabBrowser.selectedIndex, () => {
    controller.open(TEST_DATA);
    controller.waitForPageLoad();
  }, '/{"value":"popup-blocked"}');

  // Check for the close button in the notification bar
  var button = tabBrowser.getTabPanelElement(tabBrowser.selectedIndex,
                                             '/{"value":"popup-blocked"}/anon({"type":"warning"})' +
                                             utils.australis.getElement("close-button"));
  button.waitForElement();

  expect.equal(windowCount, mozmill.utils.getWindows().length,
               "The window count has not changed");
}
