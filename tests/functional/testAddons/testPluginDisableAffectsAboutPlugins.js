/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../lib/addons");
var {assert, expect} = require("../../../lib/assertions");
var domUtils = require("../../../lib/dom-utils");
var tabs = require("../../../lib/tabs");

function setupModule() {
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);

  // Skip test if we don't have enabled plugins
  if (controller.window.navigator.plugins.length < 1) {
    testDisableEnablePlugin.__force_skip__ = "No enabled plugins detected";
    teardownModule.__force_skip__ = "No enabled plugins detected";
  } else {
    persisted.plugin = controller.window.navigator.plugins[0];
  }

  addonsManager = new addons.AddonsManager(controller);
  tabs.closeAllTabs(controller);
  
}

function teardownModule() {
  // Enable the plugin that was disabled
  addons.enableAddon(persisted.plugin.getNode().mAddon.id);

  delete persisted.plugin;
}

/**
 * Tests disabling a plugin is affecting about:plugins 
 */
function testDisableEnablePlugin() {
  addonsManager.open();

  // Select the Plugins category
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "plugin"})
  });

  persisted.plugin = addonsManager.getAddons({attribute: "name",
                                             value: persisted.plugin.name})[0];

  // Check that the plugin is listed on the about:plugins page
  assert.ok(pluginExistsInAboutPlugins(),
            persisted.plugin.name + " is listed on the about:plugins page");

  // Disable the plugin
  tabBrowser.selectedIndex = 1;
  addonsManager.disableAddon({addon: persisted.plugin});

  // Check that the plugin is disabled
  assert.equal(persisted.plugin.getNode().getAttribute("active"),
               "false", persisted.plugin.getNode().mAddon.name + " has been disabled");

  // Check that the plugin disappeared from about:plugins
  expect.ok(!pluginExistsInAboutPlugins(),
            persisted.plugin.getNode().mAddon.name + " does not appear in about:plugins");

  //Enable the plugin
  tabBrowser.selectedIndex = 1;
  addonsManager.enableAddon({addon: persisted.plugin});

  // Check that the plugin is enabled
  assert.ok(persisted.plugin.getNode().getAttribute("active"),
            persisted.plugin.getNode().mAddon.name + " has been enabled");

  // Check that the plugin appears in about:plugins
  expect.ok(pluginExistsInAboutPlugins(),
            persisted.plugin.getNode().mAddon.name + " appears in about:plugins");
}

/**
 * Checks that the plugin appears in about:plugins
 *
 * @returns {boolean} True if the plugin appears in about:plugins
 */
function pluginExistsInAboutPlugins() {
  tabBrowser.selectedIndex = 0;
  controller.open("about:plugins");
  controller.waitForPageLoad();

  var exists = false;
  var nodeCollector = new domUtils.nodeCollector(controller.tabs.activeTab);
  pluginNames = nodeCollector.queryNodes(".plugname").nodes;

  for (var i = 0; i < pluginNames.length; i++) {
    if (pluginNames[i].textContent === persisted.plugin.getNode().mAddon.name) {
      exists = true;
      break;
    }
  }

  return exists;
}
