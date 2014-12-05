/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var tabs = require("../../../lib/ui/tabs");

const METHODS = [
  "sidebarButton",
  "newTabButton",
  "shortcut",
  "shortcut2"
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.TabBrowser(aModule.controller);

  tabBrowser.closeAllTabs();
}

function teardownModule(aModule) {
  tabBrowser.closeAllTabs();
}

/**
 * Bug 924077: Test open tabs functionality
 */
function testOpenTabs() {
  controller.open("about:start");
  controller.waitForPageLoad();

  // Open tabs through all defined methods
  METHODS.forEach(function (aMethod) {
    var tabsLength = tabBrowser.length;

    tabBrowser.openTab(aMethod);
    expect.equal(tabBrowser.length, tabsLength + 1,
                 "Tab has been opened via '" + aMethod + "'");
  });
}
