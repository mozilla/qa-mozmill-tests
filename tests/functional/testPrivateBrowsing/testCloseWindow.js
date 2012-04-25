/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { expect } = require("../../../lib/assertions");
var privateBrowsing = require("../../../lib/private-browsing");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

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
  // Closing the only browser window while staying in Private Browsing mode
  // will quit the application on Windows and Linux. So only on the test on OS X.
  if (!mozmill.isMac)
    return;

  var windowCount = mozmill.utils.getWindows().length;

  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  // Open local pages in separate tabs and wait for each to finish loading
  LOCAL_TEST_PAGES.forEach(function(page) {
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

  controller.waitFor(function () {
    return mozmill.utils.getWindows().length === (windowCount - 1);
  }, "The window has been closed");

  // Without a window any keypress and menu click will fail.
  // Flipping the pref directly will also do it.
  pb.enabled = false;
  controller.waitFor(function () {
    return mozmill.utils.getWindows().length === windowCount;
  }, "A window has been opened");

  utils.handleWindow("type", "navigator:browser", checkWindowOpen, false);
}

function checkWindowOpen(controller) {
  expect.equal(controller.tabs.length, (LOCAL_TEST_PAGES.length + 1),
               "All tabs have been restored");

  // Check if all local pages were re-loaded and show their content
  for (var i = 0; i < LOCAL_TEST_PAGES.length; i++) {
    var tab = controller.tabs.getTab(i);
    controller.waitForPageLoad(tab);

    var elem = new elementslib.Name(tab, LOCAL_TEST_PAGES[i].name);
    controller.assertNode(elem);
  }
}

/**
 * Map test functions to litmus tests
 */
// testCloseWindow.meta = {litmusids : [9267]};
