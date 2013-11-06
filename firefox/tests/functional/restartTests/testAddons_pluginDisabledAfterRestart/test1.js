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

  // Skip test if we don't have enabled plugins
  var activePlugins = addons.getInstalledAddons(function (aAddon) {
    if (aAddon.isActive && aAddon.type === "plugin" && !aAddon.blocklistState)
      return {
        id: aAddon.id
      }
  });

  if (activePlugins.length !== 0) {
    aModule.plugin = activePlugins[0];
  }
  else {
    testDisablePlugin.__force_skip__= "No enabled plugins detected"
  }

  // If a plugin is disabled the total number of plugins will decrease
  persisted.enabledPlugins = controller.window.navigator.plugins.length;

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  addons.setDiscoveryPaneURL("about:home");

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
 * Test disabling a plugin
 */
function testDisablePlugin() {
  addonsManager.open();

  // Select the Plugins pane
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "plugin"})
  });

  var aPlugin = addonsManager.getAddons({attribute: "value",
                                         value: plugin.id})[0];

  persisted.plugin = {
    id: aPlugin.getNode().getAttribute("value"),
    name: aPlugin.getNode().getAttribute("name")
  };

  // Disable the plugin
  addonsManager.disableAddon({addon: aPlugin});

  // Check that the plugin is disabled
  assert.equal(aPlugin.getNode().getAttribute("active"), "false",
               persisted.plugin.name + " is disabled");
}
