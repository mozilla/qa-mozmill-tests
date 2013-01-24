/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { assert, expect } = require("../../../lib/assertions");
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
    assert.ok(elem.exists(), "The name of the page has been found");

    tabBrowser.openTab();
  });

  // Start Private Browsing
  pb.start();

  // One single window will be opened in PB mode which has to be closed now
  var cmdKey = utils.getEntity(tabBrowser.getDtds(), "closeCmd.key");
  controller.keypress(null, cmdKey, {accelKey: true});

  assert.waitFor(function () {
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
    assert.ok(elem.exists(), "The name of the page has been found");
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
