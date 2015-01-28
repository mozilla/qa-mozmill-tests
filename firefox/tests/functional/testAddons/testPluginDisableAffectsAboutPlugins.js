/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var {assert, expect} = require("../../../../lib/assertions");
var domUtils = require("../../../../lib/dom-utils");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.tabBrowser = new tabs.tabBrowser(controller);

  aModule.addonsManager = new addons.AddonsManager(controller);
  addons.setDiscoveryPaneURL("about:home");

  tabs.closeAllTabs(controller);

  // Skip test if we don't have enabled plugins
  var activePlugins = addons.getInstalledAddons(function (aAddon) {
    if (aAddon.isActive && aAddon.type === "plugin" && !aAddon.blocklistState)
      return {
        id: aAddon.id,
        name: aAddon.name
      }
  });

  if (activePlugins.length !== 0) {
    aModule.plugin = activePlugins[0];
  }
  else {
    testDisableEnablePlugin.__force_skip__ = "No enabled plugins detected";
    teardownModule.__force_skip__ = "No enabled plugins detected";
  }
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_LAST_CATEGORY);

  addons.resetDiscoveryPaneURL();

  // Enable the plugin that was disabled
  addons.enableAddon(plugin.id);
  tabs.closeAllTabs(aModule.controller);
}

/**
 * Tests disabling a plugin is affecting about:plugins
 */
function testDisableEnablePlugin() {
  // Open a new tab for the addons manager page in order to have two open tabs
  // the second one will be used for handling the addons related checks
  // while the first one will be used for handling the plugins related checks
  tabBrowser.openTab();
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
      var enabledState = utils.getProperty("chrome://global/locale/plugins.properties",
                                           "state_enabled");
      exists = pluginState[i].nextSibling.nodeValue === enabledState;
      break;
    }
  }

  return exists;
}
