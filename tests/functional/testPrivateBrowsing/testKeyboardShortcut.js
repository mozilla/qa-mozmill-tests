/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var privateBrowsing = require("../../../lib/private-browsing");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

function setupModule() {
  controller = mozmill.getBrowserController();

  // Create Private Browsing instance
  pb = new privateBrowsing.privateBrowsing(controller);

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();
}

function teardownModule() {
  pb.reset();
}

/**
 * Verify Ctrl/Cmd+Shift+P keyboard shortcut for Private Browsing mode
 */
function testKeyboardShortcut() {
  // Make sure we are not in PB mode and do not show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  // Start the Private Browsing mode via the keyboard shortcut
  pb.start(true);

  // Stop the Private Browsing mode via the keyboard shortcut
  pb.stop(true);
}
