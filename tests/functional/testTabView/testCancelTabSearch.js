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
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Clay Earl Uyenghua <uyclay@gmail.com> (original author)
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

// Include the required modules
var tabs = require("../../../lib/tabs");
var tabView = require("../../../lib/tabview");
var utils = require("../../../lib/utils");

const TAB_INDEX = 1;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  {URL: LOCAL_TEST_FOLDER + 'layout/mozilla.html', name: 'community'},
  {URL: LOCAL_TEST_FOLDER + 'layout/mozilla_community.html', name: 'history'},
  {URL: LOCAL_TEST_FOLDER + 'layout/mozilla_projects.html', name: 'summary'},
  {URL: LOCAL_TEST_FOLDER + 'layout/mozilla_organizations.html', name: 'summary'}
];

function setupModule(module) {
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);
  activeTabView = new tabView.tabView(controller);
  
  tabBrowser.closeAllTabs();
}

function teardownModule(module) {
  activeTabView.reset();
  tabBrowser.closeAllTabs();
}


/**
 * Test canceling tab search in the Tab Groups view
 */
function testCancelTabSearch() {
  // Open local pages in separate tabs and wait for each to finish loading
  LOCAL_TEST_PAGES.forEach(function (page) {
    // Open a web page
    controller.open(page.URL);
    controller.waitForPageLoad();

    // Check for the correct page name after load
    var pageName = new elementslib.Name(controller.tabs.activeTab, page.name);
    controller.assertNode(pageName);

    // Open a new tab
    tabBrowser.openTab();
  });
  
  // Select the one of the tabs
  tabBrowser.selectedIndex = TAB_INDEX;

  // Open the Tab Groups view
  activeTabView.open();

  // Click the search button
  var searchButton = activeTabView.getElement({type: "search_button"});
  activeTabView.controller.click(searchButton);

  // Check the search pane is now visible
  var searchPane = activeTabView.getElement({type: "search_pane"});
  utils.assertElementVisible(controller, searchPane, true);

  // Close the search pane by pressing Escape
  activeTabView.controller.keypress(null, 'VK_ESCAPE', {});

  // Check the search pane is not visible
  utils.assertElementVisible(controller, searchPane, false);

  // Close the Tab Groups view
  activeTabView.close()

  // Check the currently active tab has not changed
  controller.assert(function () {
    return controller.tabs.activeTabIndex === TAB_INDEX
  }, "Index of selected tab has not been changed - got'" +
     controller.tabs.activeTabIndex + "', expected '" + TAB_INDEX + "'");
}
