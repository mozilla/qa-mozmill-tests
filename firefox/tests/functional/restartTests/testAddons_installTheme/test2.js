/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../../lib/addons");
var {expect} = require("../../../../../lib/assertions");
var prefs = require("../../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.clearUserPref(PREF_LAST_CATEGORY);

  delete persisted.theme;

  addons.resetDiscoveryPaneURL();
  aModule.addonsManager.close();

  aModule.controller.stopApplication(true);
}

/**
 * Verifies the theme is installed
 */
function testThemeIsInstalled() {
  addonsManager.open();

  // Set category to 'Appearance'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "theme"})
  });

  // Verify the theme is installed
  var aTheme = addonsManager.getAddons({attribute: "value", value: persisted.theme.id})[0];
  var themeIsInstalled = addonsManager.isAddonInstalled({addon: aTheme});

  expect.ok(themeIsInstalled, "The theme is successfully installed");
}
