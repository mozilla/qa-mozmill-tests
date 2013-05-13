/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "addons/layout/mozilla.html";

const ADDON = {
  id: "restartless-addon@quality.mozilla.org",
  url: BASE_URL + "addons/install.html?addon=extensions/restartless.xpi"
};

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_UPDATE_EXTENSION = "extensions.update.enabled";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);
  addons.setDiscoveryPaneURL(TEST_DATA);

  prefs.preferences.setPref(PREF_UPDATE_EXTENSION, false);

  // Set pref for add-on installation dialog timer
  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  // Whitelist localhost
  addons.addToWhiteList(BASE_URL + "addons/");

  tabs.closeAllTabs(controller);
}

/**
 * Test installing a restartless addon
 */
function testInstallRestartlessExtension() {
  persisted.addon = ADDON;

  // Install the addon
  controller.open(ADDON.url);
  controller.waitForPageLoad();

  var installLink = new elementslib.ID(controller.tabs.activeTab, "addon");
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  md.start(addons.handleInstallAddonDialog);
  controller.waitThenClick(installLink);
  md.waitForDialog(TIMEOUT_DOWNLOAD);

  addonsManager.open();

  // Set category to 'Extensions'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  // Verify the addon is installed
  var anAddon = addonsManager.getAddons({attribute: "value", value: ADDON.id})[0];
  var addonIsInstalled = addonsManager.isAddonInstalled({addon: anAddon});

  assert.ok(addonIsInstalled, ADDON.id + " is successfully installed");
}

setupModule.__force_skip__ = "Bug 784305 - Current URL should match expected URL";
