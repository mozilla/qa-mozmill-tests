/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var files = require("../../../../lib/files");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");

var { BlocklistWindow } = require("../../../lib/ui/addons_blocklist");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = {
  blocklist: BASE_URL + "addons/blocklist/softblock_extension/blocklist.xml",
  addon: {
    name: "Inline Settings (Restartless)",
    id: "restartless-inlinesettings@quality.mozilla.org",
    url: BASE_URL + "addons/install.html?addon=extensions/restartless_inlinesettings.xpi"
  }
};

const PREF_BLOCKLIST = "extensions.blocklist.url";
const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_INSTALL_SECURE = "extensions.install.requireSecureOrigin";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

const BLOCKLIST_FILE_NAME = "blocklist.xml";

function setupModule(aModule) {
  persisted.addon = TEST_DATA.addon;

  addons.setDiscoveryPaneURL("about:home");

  prefs.setPref(PREF_BLOCKLIST, TEST_DATA.blocklist);
  prefs.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);
  prefs.setPref(PREF_INSTALL_SECURE, false);

  // Whitelist add the local test folder
  addons.addToWhiteList(BASE_URL);

  var file = new files.File(files.getProfileResource(BLOCKLIST_FILE_NAME));
  file.remove();
}

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();

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
  prefs.clearUserPref(PREF_BLOCKLIST);
  prefs.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.clearUserPref(PREF_INSTALL_SECURE);
  prefs.clearUserPref(PREF_LAST_CATEGORY);

  delete persisted.addon;
  delete persisted.nextTest;

  var file = new files.File(files.getProfileResource(BLOCKLIST_FILE_NAME));
  file.remove();

  addons.resetDiscoveryPaneURL();
  aModule.controller.stopApplication(true);
}

/*
 * Install the extension to be blocklisted
 */
function testInstallBlocklistedExtension() {
  persisted.nextTest = "testBlocklistsExtension";

  controller.open(persisted.addon.url);
  controller.waitForPageLoad();

  var installLink = findElement.ID(controller.tabs.activeTab, "addon");
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  md.start(addons.handleInstallAddonDialog);
  installLink.click();
  md.waitForDialog(TIMEOUT_DOWNLOAD);
}

/*
 * Test that the extension is blocklisted
 */
function testBlocklistsExtension() {
  persisted.nextTest = "testUninstallBlocklistedExtension";

  addonsManager.open();

  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  var addon = addonsManager.getAddons({attribute: "value",
                                       value: persisted.addon.id})[0];
  assert.ok(addonsManager.isAddonInstalled({addon: addon}),
            "The addon is installed");

  var blocklistWindow = new BlocklistWindow(controller);
  blocklistWindow.open();

  // Check if the add-on name is shown in the blocklist window
  var softBlockedAddon = blocklistWindow.getElement({type: "softBlockedAddon"});
  assert.waitFor(() => {
    return softBlockedAddon.getNode().getAttribute("name") === persisted.addon.name
  }, "The addon appears in the blocklist");

  var disableCheckbox = blocklistWindow.getElement({type: "disableCheckbox",
                                                    parent: softBlockedAddon});
  controller.click(disableCheckbox);
  assert.waitFor(() => !softBlockedAddon.getNode().checked,
                 "The addon has been enabled");
}

/**
 * Test uninstalling the blocklisted extension
 */
function testUninstallBlocklistedExtension() {
  persisted.nextTest = "testBlocklistedExtensionUninstalled";

  addonsManager.open();

  var addons = addonsManager.getAddons({attribute: "name",
                                        value: persisted.addon.name});
  expect.ok(addonsManager.isAddonEnabled({addon: addons[0]}),
            "The addon is still enabled");

  addonsManager.removeAddon({addon: addons[0]});
}

/**
 * Test the blocklisted extension has been uninstalled
 */
function testBlocklistedExtensionUninstalled() {
  addonsManager.open();

  var addons = addonsManager.getAddons({attribute: "value",
                                        value: persisted.addon.id});
  assert.equal(addons.length, 0, "The blocklisted add-on is uninstalled");
}
