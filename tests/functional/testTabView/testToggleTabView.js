/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {assert} = require("../../../lib/assertions");
var tabView = require("../../../lib/tabview");

function setupModule(module) {
  controller = mozmill.getBrowserController();
  activeTabView = new tabView.tabView(controller);
}

function teardownModule(module) {
  activeTabView.reset();
}

/**
 *  Toggle and Dismiss Tab View
 */
function testToggleTabView() {
  // Open Tab View (default via keyboard shortcut)
  activeTabView.open();

  assert.ok(activeTabView.isOpen, "Tab View has been opened");

  // Close Tab View (default via keyboard shortcut)
  activeTabView.close();

  assert.ok(!activeTabView.isOpen, "Tab View has been closed");
}
