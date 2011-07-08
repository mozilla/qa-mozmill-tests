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

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

function setupModule(module) {
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);
}

function teardownModule(module) {
  tabBrowser.closeAllTabs();
}

/**
 * Tests pinning and unpinning a tab successfully in a single window
 */
function testTabPinning() {
  //open a new Tab, load a Test Page and wait for it to load
  tabBrowser.openTab();

  tabBrowser.controller.open(LOCAL_TEST_PAGE);
  tabBrowser.controller.waitForPageLoad();

  var contextMenu = tabBrowser.controller.getMenu("#tabContextMenu");
  var currentTab = tabBrowser.getTab(tabBrowser.length - 1);
  contextMenu.select("#context_pinTab", currentTab);

  // check whether it's sucessfully pinned  
  var appTabPinned = tabBrowser.isAppTab(currentTab);
  controller.assert(function () {
    return appTabPinned;
  }, "This tab has been pinned - got '" + appTabPinned + "', expected 'true'");

  contextMenu.select("#context_unpinTab", currentTab);

  // check whether it's successfully unpinned  
  var appTabUnpinned = !tabBrowser.isAppTab(currentTab);
  controller.assert(function () {
    return appTabUnpinned;
  }, "The tab is unpinned - got '" + appTabUnpinned + "', expected 'true'");
}
