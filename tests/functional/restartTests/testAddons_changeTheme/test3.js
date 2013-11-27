/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const PREF_UPDATE_EXTENSION = "extensions.update.enabled";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
}

function teardownModule() {
  delete persisted.theme;

  addonsManager.close();
  addons.resetDiscoveryPaneURL();

  prefs.preferences.clearUserPref(PREF_UPDATE_EXTENSION);
  prefs.preferences.clearUserPref(PREF_LAST_CATEGORY);

  // Bug 886811
  // Mozmill 1.5 does not have the stopApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("stopApplication" in controller) {
    controller.stopApplication(true);
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
