/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../lib/addons");
var {assert, expect} = require("../../../lib/assertions");
var domUtils = require("../../../lib/dom-utils");
var tabs = require("../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

function setupModule(aModule) {
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);

  addonsManager = new addons.AddonsManager(controller);
  addons.setDiscoveryPaneURL(LOCAL_TEST_PAGE);

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

  // Check that the plugin is listed on the about:plugins page
  assert.ok(pluginExistsInAboutPlugins(pluginName),
            pluginName + " is listed on the about:plugins page");

  // Disable the plugin
  tabBrowser.selectedIndex = 1;
  addonsManager.disableAddon({addon: selectedPlugin});

  // Check that the plugin is disabled
  assert.ok(!addonsManager.isAddonEnabled({addon: selectedPlugin}),
            pluginName + " has been disabled");

  // Check that the plugin disappeared from about:plugins
  expect.ok(!pluginExistsInAboutPlugins(pluginName),
            pluginName + " does not appear in about:plugins");

  //Enable the plugin
  tabBrowser.selectedIndex = 1;
  addonsManager.enableAddon({addon: selectedPlugin});

  // Check that the plugin is enabled
  assert.ok(addonsManager.isAddonEnabled({addon: selectedPlugin}),
            pluginName + " has been enabled");

  expect.ok(pluginExistsInAboutPlugins(pluginName),
            pluginName + " appears in about:plugins");
}

/**
 * Checks that the plugin appears in about:plugins
 *
 * @returns {boolean} True if the plugin appears in about:plugins
 */
function pluginExistsInAboutPlugins(pluginName) {
  tabBrowser.selectedIndex = 0;
  controller.open("about:plugins");
  controller.waitForPageLoad();

  var exists = false;
  var nodeCollector = new domUtils.nodeCollector(controller.tabs.activeTab);
  var pluginNames = nodeCollector.queryNodes(".plugname").nodes;

  for (var i = 0; i < pluginNames.length; i++) {
    if (pluginNames[i].textContent === pluginName) {
      exists = true;
      break;
    }
  }

  return exists;
}

