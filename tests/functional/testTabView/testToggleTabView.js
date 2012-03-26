/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
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

  // Check that Tab View has opened 
  controller.assert(function () {
    return activeTabView.isOpen;
  }, "Tab View has opened");

  // Close Tab View (default via keyboard shortcut)
  activeTabView.close();

  // Check that Tab View has closed
  controller.assert(function () {
    return !activeTabView.isOpen;
  }, "Tab View has closed");
}
