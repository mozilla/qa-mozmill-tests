/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../../lib/addons");
var {assert} = require("../../../../../lib/assertions");
var modalDialog = require("../../../../../lib/modal-dialog");
var prefs = require("../../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../../data/");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_INSTALL_SECURE = "extensions.install.requireSecureOrigin";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

const ADDON = {
  id: "restartless-addon@quality.mozilla.org",
  url: BASE_URL + "addons/install.html?addon=extensions/restartless.xpi"
};

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  addons.setDiscoveryPaneURL("about:home");

  prefs.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);
  prefs.setPref(PREF_INSTALL_SECURE, false);

  // Whitelist localhost
  addons.addToWhiteList(BASE_URL + "addons/");

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  aModule.controller.restartApplication();

  prefs.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.clearUserPref(PREF_INSTALL_SECURE);
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
