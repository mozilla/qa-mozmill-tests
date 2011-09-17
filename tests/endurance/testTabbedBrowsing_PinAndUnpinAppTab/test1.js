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
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Shriram Kunchanapalli <kshriram18@gmail.com> (original author)
 *  Dave Hunt <dhunt@mozilla.com>
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
var tabs = require("../../../lib/tabs");
var endurance = require("../../../lib/endurance");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

function setupModule(module) {
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);
  enduranceManager = new endurance.EnduranceManager(controller);
  tabBrowser.closeAllTabs();
  
  scrollButtonDown = tabBrowser.getElement({type: "tabs_scrollButton", subtype: "down"});
}

function teardownModule(module) {
  tabBrowser.closeAllTabs();
}

/**
 * Tests pinning and unpinning app tabs
 */
function testPinAndUnpinAppTab() {
  var contextMenu = tabBrowser.controller.getMenu("#tabContextMenu");
  var currentTab = null;
  enduranceManager.run(function () {

    // Open tabs
    enduranceManager.loop(function () {
        if (enduranceManager.currentEntity > 1) {
          tabBrowser.openTab();
        }
        controller.open(LOCAL_TEST_PAGE);
        controller.waitForPageLoad();
    });

    // Pin tabs
    enduranceManager.loop(function () {
      var lastTabIndex = tabBrowser.length-1;
      
      // Switch to the last tab and wait for it to scroll into view if necessary
      controller.tabs.selectTabIndex(lastTabIndex);
      controller.waitFor(function () {
        return scrollButtonDown.getNode().hasAttribute("collapsed") || scrollButtonDown.getNode().disabled;
      }, "Tab has scrolled into view.");
      
      currentTab = tabBrowser.getTab(tabBrowser.length-1);
      enduranceManager.addCheckpoint("Pinning tab");
      contextMenu.select("#context_pinTab", currentTab);
      enduranceManager.addCheckpoint("Tab has been pinned");
    });

    // Unpin tabs
    enduranceManager.loop(function () {
      currentTab = tabBrowser.getTab(0);
      enduranceManager.addCheckpoint("Unpinning tab");
      contextMenu.select("#context_unpinTab", currentTab);
      enduranceManager.addCheckpoint("Tab has been unpinned");
    });

    // Close all tabs
    tabBrowser.closeAllTabs();
  });
}
