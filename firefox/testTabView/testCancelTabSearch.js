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
 * Clay Earl Uyenghua <uyclay@gmail.com>.
 *
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Clay Earl Uyenghua <uyclay@gmail.com> (original author)
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

// Include the required modules
var Tabs = require("../../shared-modules/tabs");
var TabView = require("../../shared-modules/tabview");
var Utils = require("../../shared-modules/utils");

const TAB_INDEX = 1;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');
const LOCAL_TEST_PAGES = [
  {URL: LOCAL_TEST_FOLDER + 'layout/mozilla.html', name: 'community'},
  {URL: LOCAL_TEST_FOLDER + 'layout/mozilla_community.html', name: 'history'},
  {URL: LOCAL_TEST_FOLDER + 'layout/mozilla_projects.html', name: 'summary'},
  {URL: LOCAL_TEST_FOLDER + 'layout/mozilla_organizations.html', 
    name: 'summary'}
];

function setupModule(module) {
  controller = mozmill.getBrowserController();

  tabBrowser = new Tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();

  activeTabView = new TabView.tabView(controller);
}

function testCancelTabSearch() {
  // Open local pages in separate tabs and wait for each to finish loading
  LOCAL_TEST_PAGES.forEach(function (page) {
    controller.open(page.URL);
    controller.waitForPageLoad();

    var pageName = new elementslib.Name(controller.tabs.activeTab, page.name);
    controller.assertNode(pageName);

    tabBrowser.openTab();
  });

  // Select a tab before we open activeTabView
  tabBrowser.selectedIndex = TAB_INDEX;
  activeTabView.open();

  // Get the search button element and click
  var searchButton = activeTabView.getElement({
    type: "search_button"
  });
  activeTabView.controller.click(searchButton);

  // Check to see if search is displayed when clicking on the search button
  var search = activeTabView.getElement({
    type: "search_pane"
  });
  Utils.assertElementVisible(controller, search, true);

  // Close the group search by pressing Escape
  activeTabView.controller.keypress(null, 'VK_ESCAPE', {});

  // Check if search is closed and not displayed
  Utils.assertElementVisible(controller, search, false);

  // Close Tab View by pressing Escape
  activeTabView.controller.keypress(null, 'VK_ESCAPE', {});

  // Check if tab index displayed is same tab before we opened activeTabView
  controller.waitFor(function () {
    return controller.tabs.activeTabIndex === TAB_INDEX
  }, "Index of selected tab has not been changed - got'"
  + controller.tabs.activeTabIndex + "', expected '" + TAB_INDEX + "'");
}
