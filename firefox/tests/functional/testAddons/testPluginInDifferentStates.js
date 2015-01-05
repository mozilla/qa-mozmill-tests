/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");


const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = {
  url: BASE_URL + "plugins/flash/cookies/flash_cookie.html",
  cookieValue: "cookieValue"
};

const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

function setupModule(aModule) {
  addons.setDiscoveryPaneURL("about:home");

  // Try using Flash, otherwise any enabled plugin
  persisted.plugin = addons.getInstalledAddons(filterFlash)[0] ||
                     addons.getInstalledAddons(filterActivePlugins)[0];

  // Skip tests if no plugin found
  if (!persisted.plugin) {
    setupTest.__force_skip__ = "No enabled plugins detected";
    teardownModule.__force_skip__ = "No enabled plugins detected";
  }
}

function setupTest(aModule) {
  // Skip tests that require flash if no installation found
  if (persisted.plugin.name !== "Shockwave Flash") {
    testFlashPluginWorks.__force_skip__= "No enabled Flash plugin detected";
    testFlashPluginInactive.__force_skip__= "No enabled Flash plugin detected";
  }

  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);

  persisted.nextTest = null;
}

function teardownTest(aModule) {
  if (persisted.nextTest) {
    aModule.controller.restartApplication(persisted.nextTest);
  }
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_LAST_CATEGORY);

  // Enable the plugin that was disabled
  addons.enableAddon(persisted.plugin.id);
  addons.resetDiscoveryPaneURL();

  delete persisted.nextTest;
  delete persisted.plugin;

  aModule.controller.stopApplication(true);
}

/**
 * If the chosen plugin is flash, check that it works when enabled
 */
function testFlashPluginWorks() {
  persisted.nextTest = "testDisablePlugin";

  controller.open(TEST_DATA.url);
  controller.waitForPageLoad();

  // Wait for the getCookie() function to type undefined in the #result_get field
  var resultField = findElement.ID(controller.tabs.activeTab, "result_get");
  assert.waitFor(() => (resultField.getNode().value !== ""),
                 "Cookie value is undefined.");

  var cookieField = findElement.ID(controller.tabs.activeTab, "cookieValue");
  cookieField.sendKeys(TEST_DATA.cookieValue);

  // Set the cookie value
  var setCookie = findElement.ID(controller.tabs.activeTab, "setCookie");
  setCookie.click();

  assert.waitFor(() => (resultField.getNode().value === TEST_DATA.cookieValue),
                 "Cookie value is displayed.");
}

/**
 * Test disabling a plugin
 */
function testDisablePlugin() {
  persisted.nextTest = "testFlashPluginInactive";

  addonsManager.open();

  // Select the Plugins pane
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "plugin"})
  });

  // Disable the plugin
  var plugin = addonsManager.getAddons({attribute: "value",
                                       value: persisted.plugin.id})[0];
  addonsManager.disableAddon({addon: plugin});

  // Check that the plugin is disabled
  assert.ok(!addonsManager.isAddonEnabled({addon: plugin}),
            persisted.plugin.name + " is disabled");
}

// If the chosen plugin is flash, check that it doesn't work when disabled
function testFlashPluginInactive() {
  persisted.nextTest = "testPluginDisabled";

  controller.open(TEST_DATA.url);
  controller.waitForPageLoad();

  var cookieField = findElement.ID(controller.tabs.activeTab, "cookieValue");
  cookieField.sendKeys(TEST_DATA.cookieValue);

  // Set the cookie value
  var setCookie = findElement.ID(controller.tabs.activeTab, "setCookie");
  setCookie.click();

  var resultField = findElement.ID(controller.tabs.activeTab, "result_get");
  assert.waitFor(() => (resultField.getNode().value !== TEST_DATA.cookieValue),
                 "Cookie value is not displayed.");
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
  assert.ok(!addonsManager.isAddonEnabled({addon: plugin}),
            persisted.plugin.name + " is disabled");

  // Enable the plugin
  addonsManager.enableAddon({addon: plugin});

  // Check that the plugin is enabled
  assert.ok(addonsManager.isAddonEnabled({addon: plugin}),
            persisted.plugin.name + " is enabled");
}

/**
 * Function for filtering flash
 */
function filterFlash(aAddon) {
  if (aAddon.isActive &&
      aAddon.type === "plugin" &&
      aAddon.name === "Shockwave Flash" &&
      !aAddon.blocklistState) {
    return aAddon;
  }
}

/**
 * Function for filtering enabled plugins
 */
function filterActivePlugins(aAddon) {
  if (aAddon.isActive &&
      aAddon.type === "plugin" &&
      !aAddon.blocklistState) {
    return aAddon;
  }
}
