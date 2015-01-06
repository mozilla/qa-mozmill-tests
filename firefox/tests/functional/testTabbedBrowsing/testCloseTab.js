/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.tabBrowser.closeAllTabs();
}

var teardownModule = function(aModule) {
  aModule.tabBrowser.closeAllTabs();
}

var testCloseTab = function() {
  // Let's have 5 tabs open
  for(var i = 0; i < 4; i++) {
    tabBrowser.openTab();
  }

  assert.waitFor(function () {
    return tabBrowser.length === 5;
  }, "5 tabs have been opened");

  // Closing the tab via close button first makes bug 890181 reproducible in testrun
  tabBrowser.closeTab({method: "button"});
  assert.waitFor(function () {
    return tabBrowser.length === 4;
  }, "One tab has been closed via the close button");

  // Close a tab via File > Close tab:
  tabBrowser.closeTab({method: "menu"});
  assert.waitFor(function () {
    return tabBrowser.length === 3;
  }, "One tab has been closed via File menu");

  // Close an inactive tab via middle click
  tabBrowser.closeTab({method: "middleClick", index: 0});
  assert.waitFor(function () {
    return tabBrowser.length === 2;
  }, "One tab has been closed via middle click");

  tabBrowser.closeTab({method: "shortcut"});
  assert.waitFor(function () {
    return tabBrowser.length === 1;
  }, "One tab has been closed via keyboard shortcut");
}
