/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Anthony Hughes <ahughes@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * **** END LICENSE BLOCK ***** */

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
