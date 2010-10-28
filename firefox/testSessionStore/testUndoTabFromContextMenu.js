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
 * The Initial Developer of the Original Code is
 * Aaron Train <aaron.train@gmail.com>.
 *
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Anthony Hughes <ahughes@mozilla.com>
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
var prefs = require("../../shared-modules/testPrefsAPI");
var sessionStore = require("../../shared-modules/testSessionStoreAPI");
var tabs = require("../../shared-modules/testTabbedBrowsingAPI");
var utils = require("../../shared-modules/testUtilsAPI");

const localTestFolder = collector.addHttpResource('../test-files/');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);

  tabBrowser.closeAllTabs();
  sessionStore.resetRecentlyClosedTabs();
}

var teardownModule = function(module) {
  utils.closeContentAreaContextMenu(controller);
  sessionStore.resetRecentlyClosedTabs();
  tabBrowser.closeAllTabs();
}

var testUndoTabFromContextMenu = function() {
  // Open the tab browser context menu on the current tab
  var currentTab = tabBrowser.getTab();
  controller.rightClick(currentTab);

  // Check if 'Undo Close Tab' is hidden
  var contextMenuItem = new elementslib.ID(controller.window.document, 'context_undoCloseTab');
  controller.assertJSProperty(contextMenuItem, 'hidden', true);
  utils.closeContentAreaContextMenu(controller);

  // Check 'Recently Closed Tabs' count, should be 0
  controller.assertJS("subject.closedTabCount == 0", 
                     {closedTabCount: sessionStore.getClosedTabCount(controller)});

  // Open 3 tabs with pages in the local test folder
  for (var i = 0; i < 3; i++) {
   controller.open(localTestFolder + 
                   'tabbedbrowsing/openinnewtab_target.html?id=' + i);
   controller.waitForPageLoad();
   tabBrowser.openTab({type: 'menu'});
  }

  // Close 2nd tab via File > Close tab:
  tabBrowser.selectedIndex = 1;
  tabBrowser.closeTab({type: 'menu'});

  // Check for correct linkId on 2nd tab, should be 2
  var linkId = new elementslib.ID(controller.tabs.activeTab, "id");
  controller.assertText(linkId, "2")

  // Check 'Recently Closed Tabs' count, should be 1
  controller.assertJS("subject.closedTabCount == 1", 
                      {closedTabCount: sessionStore.getClosedTabCount(controller)});

  // Check if 'Undo Close Tab' is visible
  controller.rightClick(currentTab);
  controller.assertJSProperty(contextMenuItem, 'hidden', false);

  // Restore recently closed tab via tab browser context menu'
  controller.click(contextMenuItem);
  controller.waitForPageLoad();
  utils.closeContentAreaContextMenu(controller);

  // Check for correct linkId on 2nd tab, should be 1
  linkId = new elementslib.ID(controller.tabs.activeTab, "id");
  controller.assertText(linkId, "1");

  // Check 'Recently Closed Tabs' count, should be 0
  controller.assertJS("subject.closedTabCount == 0", 
                      {closedTabCount: sessionStore.getClosedTabCount(controller)});

  // Check if 'Undo Close Tab' is hidden
  controller.rightClick(currentTab);
  controller.assertJSProperty(contextMenuItem, 'hidden', true);
  utils.closeContentAreaContextMenu(controller);
}
