/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../lib/addons");
var {assert, expect} = require("../../../lib/assertions");
var domUtils = require("../../../lib/dom-utils");
var tabs = require("../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

function setupModule(aModule) {
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);

  addonsManager = new addons.AddonsManager(controller);
  addons.setDiscoveryPaneURL(TEST_DATA);

  tabs.closeAllTabs(controller);

  // Skip test if we don't have enabled plugins
  var activePlugins = addons.getInstalledAddons(function (aAddon) {
    if (aAddon.isActive && aAddon.type === "plugin")
      return {
        id: aAddon.id,
        name: aAddon.name
      }
  });

  if (activePlugins.length !== 0) {
    aModule.plugin = activePlugins[0];
  } else {
    testDisableEnablePlugin.__force_skip__ = "No enabled plugins detected";
    teardownModule.__force_skip__ = "No enabled plugins detected";
  }
}

function teardownModule() {
  addons.resetDiscoveryPaneURL();

  // Enable the plugin that was disabled
  addons.enableAddon(plugin.id);
  tabs.closeAllTabs(controller);
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

  var selectedPlugin = addonsManager.getAddons({attribute: "value",
                                                value: plugin.id})[0];
  var pluginName = selectedPlugin.getNode().mAddon.name;

  // Check that the plugin is listed as enabled on the about:plugins page
  assert.ok(pluginStateInAboutPlugins(pluginName),
            pluginName + " state is Enabled in about:plugins");

  // Disable the plugin
  tabBrowser.selectedIndex = 1;
  addonsManager.disableAddon({addon: selectedPlugin});

  // Check that the plugin is disabled
  assert.ok(!addonsManager.isAddonEnabled({addon: selectedPlugin}),
            pluginName + " has been disabled");

  // Check that the plugin state is Disabled in about:plugins
  expect.ok(!pluginStateInAboutPlugins(pluginName),
            pluginName + " state is Disabled in about:plugins");

  // Enable the plugin
  tabBrowser.selectedIndex = 1;
  addonsManager.enableAddon({addon: selectedPlugin});

  // Check that the plugin is enabled
  assert.ok(addonsManager.isAddonEnabled({addon: selectedPlugin}),
            pluginName + " has been enabled");

  // Check that the plugin state is Enabled in about:plugins
  expect.ok(pluginStateInAboutPlugins(pluginName),
            pluginName + " state is Enabled in about:plugins");
}

/**
 * Tests if the plugin is enabled or disabled in about:plugins
 *
 * @returns {boolean} State of the plugin in about:plugins
 */
function pluginStateInAboutPlugins(aPluginName) {
  tabBrowser.selectedIndex = 0;
  controller.open("about:plugins");
  controller.waitForPageLoad();

  var nodeCollector = new domUtils.nodeCollector(controller.tabs.activeTab);
  var pluginNames = nodeCollector.queryNodes(".plugname").nodes;
  var pluginState = nodeCollector.queryNodes("[label=state]").nodes;
  var exists = false;

  for (var i = 0; i < pluginNames.length; i++) {
    if (pluginNames[i].textContent === aPluginName) {
      exists = pluginState[i].parentNode.textContent.contains("Enabled");
      break;
    }
  }

  return exists;
}

setupModule.__force_skip__ = "Bug 865640 - Shockwave Flash and Java Plug-in are" +
                             " disabled - 'true' should equal 'false'";
teardownModule.__force_skip__ = "Bug 865640 - Shockwave Flash and Java Plug-in are" +
                                " disabled - 'true' should equal 'false'";
