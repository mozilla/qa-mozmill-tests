/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var tabView = require("../../../lib/tabview");

const TABGROUP_TITLE = "Mozilla";

function setupModule(module) {
  controller = mozmill.getBrowserController();
  activeTabView = new tabView.tabView(controller);
}

function teardownModule(module) {
  // Reset Tab Groups View settings
  activeTabView.reset();
}

/**
 *  Setting and verifying a named tab group
 */
function testTabGroupNaming() {
  // Open Tab Groups View (default via keyboard shortcut)
  activeTabView.open();

  // Verify that one tab group exists
  controller.assert(function () {
    return activeTabView.getGroups().length === 1;
  }, "One tab group exists - got: " + "'" + activeTabView.getGroups().length +
    ", expected: " + "'" + 1 + "'");

  // Get the single tab group and title
  var groups = activeTabView.getGroups();
  var title = activeTabView.getGroupTitleBox({group: groups[0]});

  // Set a name for the tab group
  controller.type(title, TABGROUP_TITLE);

  // Verify that the tab group has a new name
  controller.assert(function () {
    return title.getNode().value === TABGROUP_TITLE;
  }, "Tab group title has been set - got: " + "'" +  title.getNode().value +
    "'" + ", expected: " + "'" + TABGROUP_TITLE + "'");

  // Close Tab Groups View
  activeTabView.close();

  // Open Tab Groups View
  activeTabView.open();

   // Verify that the tab group has retained its new name
  controller.assert(function () {
    return title.getNode().value === TABGROUP_TITLE;
  }, "Tab group title has been set - got: " + "'" +  title.getNode().value +
    "'" + ", expected: " + "'" + TABGROUP_TITLE + "'");

  // Close Tab Groups View
  activeTabView.close();
}
