/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");

var EXPECTED_URL = "http://mozqa.com/data/firefox/layout/mozilla.html";

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_TRIM_URL = "browser.urlbar.trimURLs";
const PREF_UPDATE_EXTENSION = "extensions.update.enabled";

function setupModule() {
  controller = mozmill.getBrowserController();

  // Change pref to show the full url in the location bar
  prefs.preferences.setPref(PREF_TRIM_URL, false);
}

function teardownModule() {
  prefs.preferences.clearUserPref(PREF_TRIM_URL);
  prefs.preferences.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.preferences.clearUserPref(PREF_UPDATE_EXTENSION);

  addons.resetDiscoveryPaneURL();

  delete persisted.addon;
}

/**
 * Test that verifies the addon works after browser restart
 */
function testRestartlessExtensionWorksAfterRestart() {
  // Context menu item that is provided by the restartless extension
  var contextMenuItem = new elementslib.ID(controller.window.document,
                                           persisted.addon.id +
                                           "-context-menu-item-0");

  var locationBar = new elementslib.ID(controller.window.document, "urlbar");

  // Open content area context menu in a blank page
  controller.open("about:blank");
  controller.waitForPageLoad();
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
