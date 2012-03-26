/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var endurance = require("../../../lib/endurance");
var tabs = require("../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla.html', id: 'community'},
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla_mission.html', id: 'mission_statement'}
];

function setupModule() {
  controller = mozmill.getBrowserController();

  enduranceManager = new endurance.EnduranceManager(controller);
  tabBrowser = new tabs.tabBrowser(controller);

  tabBrowser.closeAllTabs();

  // Open the test pages
  LOCAL_TEST_PAGES.forEach(function (page) {
    controller.open(page.url);
    controller.waitForPageLoad();
  });
}

function teardownModule() {
 tabBrowser.closeAllTabs();
}

function testNavigateBackForward() {
  enduranceManager.run(function () {
    enduranceManager.loop(function () {
      // XXX: The forward button disappears when there is no page to forward to
      //      so we will use goBack() and goForward() methods because we don't
      //      have a method to wait for the forward button to appear, in the API.

      // Go back one page
      controller.goBack();
      var element = new elementslib.ID(controller.tabs.activeTab, LOCAL_TEST_PAGES[0].id);
      controller.waitForElement(element);
      enduranceManager.addCheckpoint("Navigated back one page");

      // Go forward one page
      controller.goForward();
      element = new elementslib.ID(controller.tabs.activeTab, LOCAL_TEST_PAGES[1].id);
      controller.waitForElement(element);
      enduranceManager.addCheckpoint("Navigated forward one page");
    });
  });
}
