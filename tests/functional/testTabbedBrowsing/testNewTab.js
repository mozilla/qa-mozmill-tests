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
 *   Tracy Walker <twalker@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Anthony Hughes <ahughes@mozilla.com>
 *   Geo Mealer <gmealer@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
 *   Vlad Maniac <vmaniac@mozilla.com>
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
 * ***** END LICENSE BLOCK ***** */

// Include required modules
var {expect} = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

const PREF_NEWTAB_URL = "browser.newtab.url";

function setupModule(module) {
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();

  // Save old state
  oldTabsOnTop = tabBrowser.hasTabsOnTop;
}

function teardownModule(module) {
  tabBrowser.hasTabsOnTop = oldTabsOnTop;
}

function testNewTab() {
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  // Ensure current tab does not have blank page loaded
  var section = new elementslib.ID(controller.tabs.activeTab, "organization");
  controller.waitForElement(section);

  // First, perform all tests with tabs on bottom
  tabBrowser.hasTabsOnTop = false;
  checkOpenTab("menu");
  checkOpenTab("shortcut");
  checkOpenTab("newTabButton");
  checkOpenTab("tabStrip");

  // Second, perform all tests with tabs on top
  tabBrowser.hasTabsOnTop = true;
  checkOpenTab("menu");
  checkOpenTab("shortcut");
  checkOpenTab("newTabButton");

  // NOTE: On Linux and beginning with Windows Vista a double click onto the
  //       tabstrip maximizes the window instead. So don't execute this test
  //       on those os versions.
  var sysInfo = Cc["@mozilla.org/system-info;1"].
                   getService(Ci.nsIPropertyBag2);
  var version = sysInfo.getProperty("version");

  if (mozmill.isMac || (mozmill.isWindows && (version < "6.0"))) {
   checkOpenTab("tabStrip");
  }
}

/**
 * Check if a new tab has been opened, has a title and can be closed
 *
 * @param {String} aEventType Type of event which triggers the action
 */
function checkOpenTab(aEventType) {
  // Open a new tab and check that 'about:newtab' has been opened
  tabBrowser.openTab(aEventType);

  // XXX: Remove this line when Bug 716108 lands
  controller.waitForPageLoad();

  var newTabURL = prefs.preferences.getPref(PREF_NEWTAB_URL, '');

  expect.equal(tabBrowser.length, 2, "Two tabs visible - opened via " + aEventType);
  expect.equal(controller.tabs.activeTab.location.href, newTabURL, 
               "Opened new tab");

  // The tabs title should be 'New Tab'
  var title = utils.getProperty("chrome://browser/locale/tabbrowser.properties", 
                                "tabs.emptyTabTitle");

  expect.equal(tabBrowser.getTab().getNode().label, title, "Correct tab title");

  // Close the tab again
  tabBrowser.closeTab();
}

/**
 * Map test functions to litmus tests
 */
// testNewTab.meta = {litmusids : [8086]};
