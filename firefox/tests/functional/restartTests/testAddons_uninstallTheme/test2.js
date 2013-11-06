/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  // Bug 867217
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("restartApplication" in aModule.controller) {
    aModule.controller.restartApplication();
  }
}

/**
 * Test theme has been installed then uninstall
 */
function testThemeIsInstalled() {
  addonsManager.open();

  // Set category to 'Appearance'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "theme"})
  });

  // Verify the theme is installed
  var theme = addonsManager.getAddons({attribute: "value", value: persisted.theme.id})[0];
  var themeIsInstalled = addonsManager.isAddonInstalled({addon: theme});

  assert.ok(themeIsInstalled, persisted.theme.id + " is installed");

  // Remove theme
  addonsManager.removeAddon({addon: theme});
}
