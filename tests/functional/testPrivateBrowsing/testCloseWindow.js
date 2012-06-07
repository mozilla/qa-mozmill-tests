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
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
 *   Remus Pop <remus.pop@softvision.ro>
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
var { expect } = require("../../../lib/assertions");
var privateBrowsing = require("../../../lib/private-browsing");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const TIMEOUT_SESSION_STORE = 250;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla.html', name: 'community'},
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla_mission.html', name: 'mission'}
];

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  pb = new privateBrowsing.privateBrowsing(controller);

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();
}

var teardownModule = function(module) {
  pb.reset();
}

/**
 * Verify when closing window in private browsing that regular session is restored
 */
var testCloseWindow = function() {
  var windowCount = mozmill.utils.getWindows().length;

  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  // Open local pages in separate tabs and wait for each to finish loading
  LOCAL_TEST_PAGES.forEach(function (page) {
    controller.open(page.url);
    controller.waitForPageLoad();

    var elem = new elementslib.Name(controller.tabs.activeTab, page.name);
    controller.assertNode(elem);

    tabBrowser.openTab();
  });

  // Start Private Browsing
  pb.start();

  // One single window will be opened in PB mode which has to be closed now
  var cmdKey = utils.getEntity(tabBrowser.getDtds(), "closeCmd.key");
  controller.keypress(null, cmdKey, {accelKey: true});

  mozmill.utils.waitFor(function () {
    return mozmill.utils.getWindows().length === (windowCount - 1);
  }, "The browser window has been closed");

  // Without a window any keypress and menu click will fail.
  // Flipping the pref directly will also do it.
  pb.enabled = false;

  utils.handleWindow("type", "navigator:browser", checkWindowOpen, false);
}

function checkWindowOpen(controller) {
  // Bug 753763
  // We do not listen for session store related events yet, so just sleep
  // for now. It has to be changed once the test is updated for Mozmill 2
  controller.sleep(TIMEOUT_SESSION_STORE);

  expect.equal(controller.tabs.length, (LOCAL_TEST_PAGES.length + 1),
               "All tabs have been restored");

  // Check if all local pages were re-loaded and show their content
  tabBrowser = new tabs.tabBrowser(controller);

  for (var i = 0; i < LOCAL_TEST_PAGES.length; i++) {
    tabBrowser.selectedIndex = i;
    controller.waitForPageLoad(controller.tabs.activeTab);

    var elem = new elementslib.Name(controller.tabs.activeTab,
                                    LOCAL_TEST_PAGES[i].name);
    controller.assertNode(elem);
  }
}

// Closing the only browser window while staying in Private Browsing mode
// will quit the application on Windows and Linux. So only on the test on OS X.
if (!mozmill.isMac) {
  setupModule.__force_skip__ = "Test is only supported on OS X";
  teardownModule.__force_skip__ = "Test is only supported on OS X";
}

/**
 * Map test functions to litmus tests
 */
// testCloseWindow.meta = {litmusids : [9267]};
