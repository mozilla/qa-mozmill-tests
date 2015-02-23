/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const ADDON = {
  url: BASE_URL + "addons/install.html?addon=extensions/icons.xpi",
  id: "test-icons@quality.mozilla.org"
};

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_INSTALL_SECURE = "extensions.install.requireSecureOrigin";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

function setupModule(aModule) {
  addons.setDiscoveryPaneURL("about:home");

  prefs.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);
  prefs.setPref(PREF_INSTALL_SECURE, false);

  // Whitelist add the local test folder
  addons.addToWhiteList(BASE_URL);
}

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);

  persisted.nextTest = null;
}

function teardownModule(aModule) {
  delete persisted.nextTest;

  prefs.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.clearUserPref(PREF_INSTALL_SECURE);

  addons.resetDiscoveryPaneURL();
  aModule.addonsManager.close();
}

function teardownTest(aModule) {
  if (persisted.nextTest) {
    controller.restartApplication(persisted.nextTest);
  }
}

/**
 * Install the add-on from data/ folder
 */
function testInstallAddon() {
  persisted.nextTest = "testDisableExtension";

  controller.open(ADDON.url);
  controller.waitForPageLoad();

  var installLink = findElement.ID(controller.tabs.activeTab, "addon");
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  // Install the add-on
  md.start(addons.handleInstallAddonDialog);
  installLink.click();
  md.waitForDialog(TIMEOUT_DOWNLOAD);
}

/**
 * Test disable an extension
 */
function testDisableExtension() {
  persisted.nextTest = "testEnableExtension";
  addonsManager.open();

  // Get the extensions pane
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  // Get the addon by name
  var addon = addonsManager.getAddons({attribute: "value",
                                       value: ADDON.id})[0];

  // Disable the addon
  addonsManager.disableAddon({addon: addon});
}

/**
 * Test enable the extension
 */
function testEnableExtension() {
  persisted.nextTest = "testCheckAddonIsEnabled";
  addonsManager.open();

  // Get the addon by name
  var addon = addonsManager.getAddons({attribute: "value",
                                       value: ADDON.id})[0];

  // Check if the addon is disabled
  assert.ok(!addonsManager.isAddonEnabled({addon: addon}),
            "The addon is disabled");

  // Enable the addon
  addonsManager.enableAddon({addon: addon});
}

/**
 * Test check if addon is enabled
 */
function testCheckAddonIsEnabled() {
  addonsManager.open();

  // Get the addon by name
  var addon = addonsManager.getAddons({attribute: "value",
                                       value: ADDON.id})[0];

  // Check if the addon is enabled
  assert.ok(addonsManager.isAddonEnabled({addon: addon}), "The addon is enabled");
}
