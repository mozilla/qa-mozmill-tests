/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  prefs.preferences.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.preferences.clearUserPref(PREF_LAST_CATEGORY);

  delete persisted.theme;

  aModule.addonsManager.close();
  addons.resetDiscoveryPaneURL();

  // Bug 886811
  // Mozmill 1.5 does not have the stopApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("stopApplication" in aModule.controller) {
    aModule.controller.stopApplication(true);
  }
}

/*
 * Verify we changed to the default theme
 */
function testChangedThemeToDefault() {
  addonsManager.open();

  // Verify the default theme is active
  var defaultTheme = addonsManager.getAddons({attribute: "value",
                                              value: persisted.theme[1].id})[0];

  assert.equal(defaultTheme.getNode().getAttribute("active"), "true");
}

setupModule.__force_skip__ = "Bug 931704 - plainTheme is undefined.";
teardownModule.__force_skip__ = "Bug 931704 - plainTheme is undefined.";
