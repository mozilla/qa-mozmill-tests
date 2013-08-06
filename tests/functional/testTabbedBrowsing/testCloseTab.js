/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { assert } = require("../../../lib/assertions");
var tabs = require("../../../lib/tabs");

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();
}

var teardownModule = function(module) {
  tabBrowser.closeAllTabs();
}


var testCloseTab = function()
{
  // Let's have 5 tabs open
  for(var i = 0; i < 4; i++) {
    tabBrowser.openTab();
  }

  assert.waitFor(function () {
    return tabBrowser.length === 5;
  }, "5 tabs have been opened");

  // Close a tab by pressing the keyboard shortcut:
  tabBrowser.closeTab("shortcut");
  assert.waitFor(function () {
    return tabBrowser.length === 4;
  }, "One tab has been closed via keyboard shortcut");

  // Close a tab via File > Close tab:
  tabBrowser.closeTab("menu");
  assert.waitFor(function () {
    return tabBrowser.length === 3;
  }, "One tab has been closed via File menu");

  // Close an inactive tab via middle click
  tabBrowser.closeTab("middleClick", 0);
  assert.waitFor(function () {
    return tabBrowser.length === 2;
  }, "One tab has been closed via middle click");

  // Close a tab via the close button on the tab itself:
  tabBrowser.closeTab("closeButton");
  assert.waitFor(function () {
    return tabBrowser.length === 1;
  }, "One tab has been closed using the close button");
}

/**
 * Map test functions to litmus tests
 */
// testOpenInBackgroundTab.meta = {litmusids : [8094]};
