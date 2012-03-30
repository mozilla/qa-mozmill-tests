/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { expect } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const localTestFolder = collector.addHttpResource('../../../data/');

const PREF_POPUP_BLOCK = "dom.disable_open_during_load";

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);

  prefs.preferences.setPref(PREF_POPUP_BLOCK, true);
}

var teardownModule = function(module)
{
  // Reset the pop-up blocking pref and close all open tabs
  prefs.preferences.clearUserPref(PREF_POPUP_BLOCK);
  tabBrowser.closeAllTabs();

  for each (window in mozmill.utils.getWindows("navigator:browser")) {
    if (!window.toolbar.visible)
      window.close();
  }
}

/**
 * Test to make sure pop-ups are blocked
 *
 */
var testPopUpBlocked = function()
{
  var windowCount = mozmill.utils.getWindows().length;

  // Open the Pop-up test site
  controller.open(localTestFolder + "popups/popup_trigger.html?count=2");
  controller.waitForPageLoad();

  // Check for the close button in the notification bar
  var button = tabBrowser.getTabPanelElement(tabBrowser.selectedIndex,
                                             '/{"value":"popup-blocked"}/anon({"type":"warning"})' +
                                             '/{"class":"messageCloseButton tabbable"}');
  
  tabBrowser.waitForTabPanel(tabBrowser.selectedIndex, '/{"value":"popup-blocked"}');
  controller.waitForElement(button, gTimeout);

  expect.equal(windowCount, mozmill.utils.getWindows().length,
               "The window count has not changed");
}
