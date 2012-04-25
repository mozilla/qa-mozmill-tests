/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { expect } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const localTestFolder = collector.addHttpResource('../../../data/');

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);
}

var teardownModule = function(module)
{
  // Reset the pop-up blocking pref and close all open tabs
  prefs.preferences.clearUserPref("dom.disable_open_during_load");
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

  prefs.openPreferencesDialog(controller, prefDialogCallback);

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

/**
 * Call-back handler for preferences dialog
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneContent';

  // Make sure the pref is checked
  var pref = new elementslib.ID(controller.window.document, "popupPolicy");
  controller.waitForElement(pref, gTimeout);
  controller.check(pref, true);

  prefDialog.close(true);
}

/**
 * Map test functions to litmus tests
 */
// testPopUpBlocked.meta = {litmusids : [7961]};
