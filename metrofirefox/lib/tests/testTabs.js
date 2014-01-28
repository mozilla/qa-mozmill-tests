/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { expect } = require("../../../lib/assertions");
var tabs = require("../ui/tabs");

const BASE_URL = collector.addHttpResource("../../../data/");
const TEST_DATA = [
  BASE_URL + "layout/mozilla_community.html",
  BASE_URL + "layout/mozilla_mission.html"
];

const ELEMENTS = [
  {name: "newTabButton", type: "toolbarbutton"},
  {name: "sidebar_backButton", type: "div"},
  {name: "sidebar_newTabButton", type: "div"},
  {name: "tray", type: "vbox"}
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.TabBrowser(aModule.controller);
}

function teardownModule(aModule) {
  tabBrowser.closeAllTabs();
}

function testTabs() {
  TEST_DATA.forEach(function (aPage) {
    controller.open(aPage);
    controller.waitForPageLoad();
    tabBrowser.openTab();
  });

  expect.ok(tabBrowser.isVisible(), "Tabs container is visible");

  // Check the elements on each side and the new tab button
  ELEMENTS.forEach(function (aElement) {
    var element = tabBrowser.getElement({type: aElement.name});
    expect.equal(element.getNode().localName, aElement.type,
                 aElement.name + " exists");
  });

  tabBrowser.closeTab();
  expect.equal(tabBrowser.length, 2, "Tab has been closed");

  tabBrowser.openTab();
  expect.equal(tabBrowser.length, 3, "Another tab has been opened");

  tabBrowser.selectedIndex = 1;
  expect.equal(tabBrowser.selectedIndex, 1, "Second tab has been selected");

  // Close the first tab
  tabBrowser.closeTab("button", 0);
  expect.ok(tabBrowser.selectedIndex === 0 &&
            controller.tabs.activeTab.location.href.indexOf("mozilla_community") == -1,
            "First tab has been closed");

  tabBrowser.closeAllTabs();
  expect.equal(tabBrowser.length, 1, "All previously opened tabs have been closed");
}
