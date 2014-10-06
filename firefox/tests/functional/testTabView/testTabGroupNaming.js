  /* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var {assert, expect} = require("../../../../lib/assertions");
var tabView = require("../../../lib/tabview");

const TABGROUP_TITLE = "Mozilla";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.activeTabView = new tabView.tabView(aModule.controller);
}

function teardownModule(aModule) {
  // Reset Tab Groups View settings
  aModule.activeTabView.reset();
}

/**
 *  Setting and verifying a named tab group
 */
function testTabGroupNaming() {
  // Open Tab Groups View (default via keyboard shortcut)
  activeTabView.open();

  assert.equal(activeTabView.getGroups().length, 1, "One tab group exists");

  // Get the single tab group and title
  var groups = activeTabView.getGroups();
  var title = activeTabView.getGroupTitleBox({group: groups[0]});

  // Set a name for the tab group
  controller.type(title, TABGROUP_TITLE);

  expect.equal(title.getNode().value, TABGROUP_TITLE,
               "Tab group title has been set");

  // Close Tab Groups View
  activeTabView.close();

  // Open Tab Groups View
  activeTabView.open();

  expect.equal(title.getNode().value, TABGROUP_TITLE,
               "Tab group has retained its new name");

  // Close Tab Groups View
  activeTabView.close();
}
