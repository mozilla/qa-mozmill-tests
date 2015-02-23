/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var prefWindow = require("../../../lib/ui/pref-window");
var tabs = require("../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_INSTALL_SECURE = "extensions.install.requireSecureOrigin";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

const ADDONS = [
  {id: "test-icons@quality.mozilla.org",
   url: BASE_URL + "addons/install.html?addon=extensions/icons.xpi"},
  {id: "test-long-name@quality.mozilla.org",
   url: BASE_URL + "addons/install.html?addon=extensions/long-name.xpi"}
];

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

function teardownTest(aModule) {
  if (addonsManager.isOpen) {
    addonsManager.close();
  }

  if (persisted.nextTest) {
    controller.restartApplication(persisted.nextTest);
  }
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.clearUserPref(PREF_INSTALL_SECURE);
  prefs.clearUserPref(PREF_LAST_CATEGORY);

  delete persisted.nextTest;

  addons.resetDiscoveryPaneURL();
  aModule.controller.stopApplication(true);
 }

/**
 * Install some add-ons to test uninstallation
 */
function testInstallExtensions() {
  persisted.nextTest = "testDisableExtension";

  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  ADDONS.forEach(function (aAddon) {
    // Install the addon
    controller.open(aAddon.url);
    controller.waitForPageLoad();

    var installLink = findElement.ID(controller.tabs.activeTab, "addon");

    md.start(addons.handleInstallAddonDialog);
    installLink.click();
    md.waitForDialog(TIMEOUT_DOWNLOAD);

    // Dispose of the restart doorhanger notification by keyboard event
    controller.keypress(null , 'VK_ESCAPE', {});
  });
}

/**
 * Tests for successful add-on installation and disables one add-on
 */
function testDisableExtension() {
  persisted.nextTest = "testUninstallDisabledExtension";

  addonsManager.open();

  // Go to extensions pane
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  var enabledExtension = addonsManager.getAddons({attribute: "value",
                                                  value: ADDONS[0].id})[0];
  var toDisableExtension = addonsManager.getAddons({attribute: "value",
                                                    value: ADDONS[1].id})[0];

  // Check that the extensions were installed
  assert.ok(addonsManager.isAddonInstalled({addon: enabledExtension}),
            "Extension '" + ADDONS[0].id + "' was installed");
  assert.ok(addonsManager.isAddonInstalled({addon: toDisableExtension}),
            "Extension '" + ADDONS[1].id + "' was installed");

  // Disable the extension
  addonsManager.disableAddon({addon: toDisableExtension});

  // Check that the extension was marked for disable
  assert.equal(toDisableExtension.getNode().getAttribute("pending"), "disable",
               "The extension '" + ADDONS[1].id + "' was marked for disable");
}

/**
 * Test for uninstalling a disabled add-on
 */
function testUninstallDisabledExtension() {
  persisted.nextTest = "testUndoUninstall";

  addonsManager.open();

  // Check that the extension was disabled
  var disabledExtension = addonsManager.getAddons({attribute: "value",
                                                   value: ADDONS[1].id})[0];
  assert.ok(!addonsManager.isAddonEnabled({addon: disabledExtension}),
            "Extension '" + ADDONS[1].id + "' is disabled");

  // Remove the disabled extension
  addonsManager.removeAddon({addon: disabledExtension});

  // Switch categories to dispose of the undo link
  // Set category to 'Appearance'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "theme"})
  });

  // Switch back to 'Extensions'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  // Check that the disabled extension was uninstalled
  var addonIdList = addonsManager.getAddons({attribute: "value",
                                             value: ADDONS[1].id});
  assert.equal(addonIdList.length, 0,
               "Extension '" + ADDONS[1].id + "' has been uninstalled");
}

/**
 * Test uninstall and then Undo
 */
function testUndoUninstall() {
  persisted.nextTest = "testAddonNotUninstalled";

  addonsManager.open();

  // Check that the disabled extension was uninstalled
  var addon = addonsManager.getAddons({attribute: "value",
                                       value: ADDONS[1].id});
  assert.equal(addon.length, 0,
               "Extension '" + ADDONS[1].id + "' has been uninstalled");

  // Get the addon by name and check if the addon is enabled
  var addon = addonsManager.getAddons({attribute: "value",
                                       value: ADDONS[0].id})[0];
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

/**
 * Test that the addon was not uninstalled
 */
function testAddonNotUninstalled() {
  persisted.nextTest = "testCheckAddonIsUninstalled";

  addonsManager.open();

  // Get the addon by name
  var addon = addonsManager.getAddons({attribute: "value",
                                       value: ADDONS[0].id})[0];

  // Check if the addon is still installed and enabled after restart
  assert.ok(addonsManager.isAddonInstalled({addon: addon}),
            "The addon is installed");
  assert.ok(addonsManager.isAddonEnabled({addon: addon}), "The addon is enabled");

  // Remove the enabled extension
  addonsManager.removeAddon({addon: addon});

  // Check that the enabled extension was marked for removal
  assert.equal(addon.getNode().getAttribute("pending"), "uninstall",
               "Extension '" + ADDONS[0].id + "' was marked for uninstall");
}

/**
 * Test check that the enabled extension is still uninstalled after restart
 */
function testCheckAddonIsUninstalled() {
  addonsManager.open();

  // Check that the enabled extension is still uninstalled after restart
  var addon = addonsManager.getAddons({attribute: "value",
                                       value: ADDONS[0].id});
  assert.equal(addon.length, 0,
               "Extension '" + ADDONS[0].id + "' has been uninstalled");
}
