/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../../lib/addons");
var {assert} = require("../../../../../lib/assertions");
var prefs = require("../../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");
var utils = require("../../../../../lib/utils");

const TEST_DATA = "http://mozqa.com/data/firefox/layout/mozilla.html";

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";
const PREF_TRIM_URL = "browser.urlbar.trimURLs";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  // Change pref to show the full url in the location bar
  prefs.setPref(PREF_TRIM_URL, false);
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_TRIM_URL);
  prefs.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.clearUserPref(PREF_LAST_CATEGORY);

  delete persisted.addon;

  addons.resetDiscoveryPaneURL();

  aModule.controller.stopApplication(true);
}

/**
 * Test that verifies the addon works after browser restart
 */
function testRestartlessExtensionWorksAfterRestart() {
  var locationBar = new elementslib.ID(controller.window.document, "urlbar");

  // Open content area context menu in a blank page
  controller.open("about:blank");
  controller.waitForPageLoad();
  var htmlElement = new elementslib.XPath(controller.tabs.activeTab, "/html");
  controller.rightClick(htmlElement);

  // Select "Open MozQA" context menu entry
  var contextMenu = controller.getMenu("#contentAreaContextMenu");
  tabBrowser.openTab({method: "callback", callback: () => {
    contextMenu.select(".addon-context-menu-item.addon-context-menu-item-toplevel",
                       htmlElement);
  }});
  controller.waitForPageLoad();

  // Verify that the loaded url matches http://mozqa.com/data/firefox/layout/mozilla.html
  assert.equal(locationBar.getNode().value, TEST_DATA,
               "Current URL matches expected URL");
}
