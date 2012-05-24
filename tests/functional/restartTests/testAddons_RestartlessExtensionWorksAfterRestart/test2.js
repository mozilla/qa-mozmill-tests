/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {assert} = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");
var utils = require("../../../../lib/utils");

var EXPECTED_URL = "http://mozqa.com/data/firefox/layout/mozilla.html";

function setupModule() {
  controller = mozmill.getBrowserController();
  tabs.closeAllTabs(controller);
}

function teardownModule() {
  prefs.preferences.clearUserPref("browser.urlbar.trimURLs");

  delete persisted.addon;
}

/**
 * Test that verifies the addon works after browser restart
 */
function testRestartlessExtensionWorksAfterRestart() {
  // Change pref to show the full url in the location bar
  prefs.preferences.setPref("browser.urlbar.trimURLs", false);

  // Context menu item that is provided by the restartless extension
  var contextMenuItem = new elementslib.ID(controller.window.document,
                                           persisted.addon.id +
                                           "-context-menu-item-0");

  var locationBar = new elementslib.ID(controller.window.document, "urlbar");

  // Open content area context menu
  controller.rightClick(new elementslib.XPath(controller.tabs.activeTab, "/html"));

  // Click the item from the context menu to open mozilla.html from mozqa.com
  controller.click(contextMenuItem);

  // Close the context menu
  utils.closeContentAreaContextMenu(controller);
  controller.waitForPageLoad();

  // Verify that the loaded url matches http://mozqa.com/data/firefox/layout/mozilla.html
  assert.equal(locationBar.getNode().value, EXPECTED_URL,
               "Current URL should match expected URL");
}

// Bug 719982 - Failure in testAddons_RestartlessExtensionWorksAfterRestart | 
//              Modal dialog has been found and processed
setupModule.__force_skip__ = "Bug 719982 - Failure in testAddons_RestartlessExtensionWorksAfterRestart " +
                             " | Modal dialog has been found and processed";
teardownModule.__force_skip__ = "Bug 719982 - Failure in testAddons_RestartlessExtensionWorksAfterRestart " +
                                " | Modal dialog has been found and processed";
