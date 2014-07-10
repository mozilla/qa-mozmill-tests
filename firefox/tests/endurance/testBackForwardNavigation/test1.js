/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var endurance = require("../../../../lib/endurance");
var tabs = require("../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = [
  {url: BASE_URL + "layout/mozilla.html", id: "community"},
  {url: BASE_URL + "layout/mozilla_mission.html", id: "mission_statement"}
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();

  // Open the test pages
  TEST_DATA.forEach(function (aPage) {
    aModule.controller.open(aPage.url);
    aModule.controller.waitForPageLoad();
  });
}

function teardownModule(aModule) {
  aModule.tabBrowser.closeAllTabs();
}

function testNavigateBackForward() {
  enduranceManager.run(function () {
    enduranceManager.loop(function () {
      // TODO: The forward button disappears when there is no page to forward to
      // so we will use goBack() and goForward() methods because we don't
      // have a method to wait for the forward button to appear, in the API.

      // Go back one page
      controller.goBack();
      var element = new elementslib.ID(controller.tabs.activeTab, TEST_DATA[0].id);
      controller.waitForElement(element);
      enduranceManager.addCheckpoint("Navigated back one page");

      // Go forward one page
      controller.goForward();
      element = new elementslib.ID(controller.tabs.activeTab, TEST_DATA[1].id);
      controller.waitForElement(element);
      enduranceManager.addCheckpoint("Navigated forward one page");
    });
  });
}
