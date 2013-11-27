/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  // Skip test if we have no plugins
  if (persisted.enabledPlugins < 1) {
    testPluginDisabled.__force_skip__ = "No enabled plugins detected";
    teardownModule.__force_skip__ = "No enabled plugins detected";
  }

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  prefs.preferences.clearUserPref(PREF_LAST_CATEGORY);

  // Enable the plugin that was disabled
  addons.enableAddon(persisted.plugin.id);
  addons.resetDiscoveryPaneURL();

  delete persisted.enabledPlugins;
  delete persisted.plugin;

  // Bug 886811
  // Mozmill 1.5 does not have the stopApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("stopApplication" in aModule.controller) {
    aModule.controller.stopApplication(true);
  }
}

/**
 * Test if a disabled plugin is disabled after restart
 */
function testPluginDisabled() {
  // Open the Add-ons Manager
  addonsManager.open();

  var plugin = addonsManager.getAddons({attribute: "value",
                                        value: persisted.plugin.id})[0];

  // Check that the plugin is disabled
  assert.equal(plugin.getNode().getAttribute("active"), "false",
               persisted.plugin.name + " is disabled");

  // Enable the plugin
  addonsManager.enableAddon({addon: plugin});

  // Check that the plugin is enabled
  assert.equal(plugin.getNode().getAttribute("active"), "true",
               persisted.plugin.name + " is enabled");
}
