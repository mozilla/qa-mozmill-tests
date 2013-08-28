/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

function setupModule() {
  controller = mozmill.getBrowserController();

  // Skip test if we have no plugins
  if (persisted.enabledPlugins < 1) {
    testPluginDisabled.__force_skip__ = "No enabled plugins detected";
    teardownModule.__force_skip__ = "No enabled plugins detected";
  }

  addonsManager = new addons.AddonsManager(controller);
  tabs.closeAllTabs(controller);
}

function teardownModule() {
  // Enable the plugin that was disabled
  addons.enableAddon(persisted.plugin.id);

  delete persisted.enabledPlugins;
  delete persisted.plugin;

  // Bug 886811
  // Mozmill 1.5 does not have the stopApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("stopApplication" in controller) {
    controller.stopApplication(true);
  }
}

/**
 * Test if a disabled plugin is disabled after restart
 */
function testPluginDisabled() {
  // Open the Add-ons Manager
  addonsManager.open();

  plugin = addonsManager.getAddons({attribute: "value",
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
