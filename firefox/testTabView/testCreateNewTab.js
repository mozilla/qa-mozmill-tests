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
var Toolbars = require("../../shared-modules/toolbars");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');
const LOCAL_TEST_PAGES = {
  URL: LOCAL_TEST_FOLDER + 'layout/mozilla.html',
  name: 'community'
};
const TEST_FULLSCREEN = [
  true,
  false
];

function setupModule(module) {
  controller = mozmill.getBrowserController();

  tabBrowser = new Tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();

  activeTabView = new TabView.tabView(controller);
  locationBar = new Toolbars.locationBar(controller);
}

function teardownModule(module) {
  // Reset fullScreen property to false
  controller.window.document.defaultView.fullScreen = false;
}

function testCreateNewTab() {
  // Perform test twice for normal and full screen
  for (var i = 0; i < 2; i++) {
    // Open the local page and wait for page to load
    controller.open(LOCAL_TEST_PAGES.URL);
    controller.waitForPageLoad();

    // Check that the local test page opened successfully
    var pageName = new elementslib.Name(controller.tabs.activeTab,
                                        LOCAL_TEST_PAGES.name);
    controller.assertNode(pageName);

    // Open tab view
    activeTabView.open();

    // Get the active group element
    var activeGroup = activeTabView.getElement({
      type: "groups",
      subtype: "active"
    });

    // Get the number of tabs for the active group
    var activeGroupTabs = activeTabView.getTabs({
      filter: "group",
      value: activeGroup
    });
    var tabCount = activeGroupTabs.length;

    // Click the new tab button of the active group
    var newTabButton = activeTabView.getElement({
      type: "group_newTabButton", 
      parent: activeGroup
    });
    activeTabView.controller.click(newTabButton);

    // The tab will focus and we wait until tabView is closed
    controller.waitFor(function () {
      return !activeTabView.isOpen
    }, "Tab View has been closed");

    // Check that a new tab is opened
    controller.waitFor(function () {
      return controller.tabs.activeTab.URL === 'about:blank'
    }, "Expected a new tab to open - got '"
    + controller.tabs.activeTab.URL + "', expected 'about:blank'");

    // Open tab view again to check for tab count
    activeTabView.open();
	
    // Get the active group element
    activeGroup = activeTabView.getElement({
      type: "groups",
      subtype: "active"
    });

    // Get the current number of tabs for the active group
    activeGroupTabs = activeTabView.getTabs({
      filter: "group", 
      value: activeGroup
    });
    var currentTabCount = activeGroupTabs.length;

    // Check current tab count has one more tab than previous tab count
    controller.waitFor(function () {
      return tabCount === currentTabCount-1
    }, "Expected tab count to increment after opening new tab - got tabCount '"
	+ tabCount + "', expected tabCount '" + currentTabCount-1 + "'");

    // Close tab view and click on full screen for next test
    activeTabView.close();
    controller.mainMenu.click("#fullScreenItem");
    
    // Check if we should be in full screen or not
    var view = controller.window.document.defaultView;
    controller.waitFor(function () {
      return view.fullScreen === TEST_FULLSCREEN[i]
    }, "Expected full screen to change - got state '"
	+ view.fullScreen + "', expected state '" + TEST_FULLSCREEN[i] + "'");
  }
}
