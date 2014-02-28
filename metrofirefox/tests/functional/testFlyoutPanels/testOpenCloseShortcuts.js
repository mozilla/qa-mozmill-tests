/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var flyoutPanel = require("../../../lib/ui/flyoutPanel");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.flyoutPanel = new flyoutPanel.FlyoutPanel(aModule.controller);
}

function teardownModule(aModule) {
  flyoutPanel.closeAllPanels(true);
}

/**
 * Bug 978078: Test open/close flyout panels through shortcuts
 */
function testOpenCloseShortcuts() {
  flyoutPanel.openPanel("about", "shortcut");
  flyoutPanel.closePanel("about", {eventType: "shortcut"});

  flyoutPanel.openPanel("options", "shortcut");
  flyoutPanel.closePanel("options", {eventType: "shortcut"});
}
