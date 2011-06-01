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
 * The Original Code is Mozmill Test code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Anthony Hughes <ahughes@mozilla.com> (Original Author)
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
var endurance = require("../../../lib/endurance");
var tabs = require("../../../lib/tabs");
var tabView = require("../../../lib/tabview");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  LOCAL_TEST_FOLDER + 'layout/mozilla.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_community.html'
];

function setupModule() {
  controller = mozmill.getBrowserController();
  enduranceManager = new endurance.EnduranceManager(controller);
  tabBrowser = new tabs.tabBrowser(controller);
  activeTabView = new tabView.tabView(controller);
  
  tabBrowser.closeAllTabs();
}

function teardownModule() {
  activeTabView.reset();
  tabBrowser.closeAllTabs();
}

/**
 * Test switching tabs from the Tab Groups view
 **/
function testSwitchTabs() {
  // Load two pages in separate tabs before iterating
  controller.open(LOCAL_TEST_PAGES[0]);
  controller.waitForPageLoad();

  tabBrowser.openTab();
  
  controller.open(LOCAL_TEST_PAGES[1]);
  controller.waitForPageLoad();
      
  enduranceManager.run(function () {
    // Open the Tab Groups view
    enduranceManager.addCheckpoint("Open the Tab Groups view");
    activeTabView.open();
    enduranceManager.addCheckpoint("Tab Groups view now open");
    
    // Switch to the tab which is not active
    enduranceManager.addCheckpoint("Switch to the inactive tab");    
    var activeTab = activeTabView.getTabs({filter: "active"})[0];
    var allTabs = activeTabView.getTabs();
    
    // Select the tab which is NOT active
    if (activeTab.getNode() === allTabs[0].getNode()) {
        activeTabView.controller.click(allTabs[1]);
    } else {
        activeTabView.controller.click(allTabs[0]);
    }

    // Wait for the selected tab to display
    activeTabView.waitForClosed();
    enduranceManager.addCheckpoint("Selected tab is now displayed");  
  });
}
