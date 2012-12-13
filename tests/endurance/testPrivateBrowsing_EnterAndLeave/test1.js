/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var Endurance = require("../../../lib/endurance");
var PrivateBrowsing = require("../../../lib/private-browsing");
var Tabs = require("../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [LOCAL_TEST_FOLDER + 'layout/mozilla.html',
                          LOCAL_TEST_FOLDER + 'layout/mozilla_community.html',
                          LOCAL_TEST_FOLDER + 'layout/mozilla_contribute.html',
                          LOCAL_TEST_FOLDER + 'layout/mozilla_governance.html',
                          LOCAL_TEST_FOLDER + 'layout/mozilla_grants.html'
];

function setupModule() {
  controller = mozmill.getBrowserController();
  enduranceManager = new Endurance.EnduranceManager(controller);

  pb = new PrivateBrowsing.privateBrowsing(controller);
  // Make sure we are not in PB mode and do not show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  tabBrowser = new Tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();
}

function teardownModule() {
  pb.reset();
  tabBrowser.closeAllTabs();
}

function testEnterAndLeaveWithMutlipleTabsOpen() {

  // Open local pages in separate tabs and wait for each to finish loading
  LOCAL_TEST_PAGES.forEach(function (url) {
    controller.open(url);
    controller.waitForPageLoad();
    tabBrowser.openTab();
  });

  enduranceManager.run(function () {
    pb.start();
    enduranceManager.addCheckpoint("Entered private browsing mode");
    pb.stop();
    enduranceManager.addCheckpoint("Left private browsing mode");
  });
}

setupModule.__force_skip__ = "Bug 818456 - Investigate and prepare existing Mozmill tests" +
                             " for per window private browsing";
teardownModule.__force_skip__ = "Bug 818456 - Investigate and prepare existing Mozmill tests" +
                                " for per window private browsing";
