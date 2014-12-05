/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const ADDON = {
  url: BASE_URL + "addons/extensions/icons.xpi",
  id: "test-icons@quality.mozilla.org"
};

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

function setupModule(aModule) {
  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);
  addons.setDiscoveryPaneURL("about:home");
}

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);

  persisted.nextTest = null;
}

function teardownModule(aModule) {
  delete persisted.nextTest;
  prefs.preferences.clearUserPref(PREF_INSTALL_DIALOG);

  addons.resetDiscoveryPaneURL();
  aModule.addonsManager.close();
}

function teardownTest(aModule) {
  if (persisted.nextTest) {
    controller.restartApplication(persisted.nextTest);
  }
}

/*
 * Install the add-on from data/ folder
 */
function testInstallAddon() {
  persisted.nextTest = "testDisableExtension";

  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  // Install the add-on
  md.start(addons.handleInstallAddonDialog);
  controller.open(ADDON.url);
  md.waitForDialog(TIMEOUT_DOWNLOAD);
}

/*
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

/*
 * Test enable the extension
 */
function testEnableExtension() {
  persisted.nextTest = "testUndoUninstall";

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

/*
 * Test uninstall and then Undo
 */
function testUndoUninstall() {
  persisted.nextTest = "testAddonNotUninstalled";

  addonsManager.open();

  // Get the addon by name
  var addon = addonsManager.getAddons({attribute: "value",
                                       value: ADDON.id})[0];

  // Check if the addon is enabled
  assert.ok(addonsManager.isAddonEnabled({addon: addon}), "The addon is enabled");

  // Remove the addon
  addonsManager.removeAddon({addon: addon});
  assert.equal(addon.getNode().getAttribute("pending"), "uninstall",
               "Addon was marked for uninstall");

  // Undo addon removal
  addonsManager.undo({addon: addon});
  assert.equal(addon.getNode().getAttribute("pending"), "",
               "Addon is no longer marked for uninstall");

  // Check that addon is still installed
  assert.ok(addonsManager.isAddonInstalled({addon: addon}),
            "The addon is installed");

  // Check if the addon is enabled
  assert.ok(addonsManager.isAddonEnabled({addon: addon}), "The addon is enabled");
}

/*
 * Test that the addon was not uninstalled
 */
function testAddonNotUninstalled() {
  addonsManager.open();

  // Get the addon by name
  var addon = addonsManager.getAddons({attribute: "value",
                                       value: ADDON.id})[0];

  // Check if the addon is still installed and enabled after restart
  assert.ok(addonsManager.isAddonInstalled({addon: addon}),
            "The addon is installed");
  assert.ok(addonsManager.isAddonEnabled({addon: addon}), "The addon is enabled");
}
