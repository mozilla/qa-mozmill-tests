/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const LOCAL_INSTALL_FILE = "install.html?addon=";
const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../../data/addons/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

const ADDON = {
  id: "restartless-addon@quality.mozilla.org",
  url: LOCAL_TEST_FOLDER + LOCAL_INSTALL_FILE + "extensions/restartless.xpi"
};

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_UPDATE_EXTENSION = "extensions.update.enabled";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);
  addons.setDiscoveryPaneURL(LOCAL_TEST_PAGE);

  prefs.preferences.setPref(PREF_UPDATE_EXTENSION, false);

  // Set pref for add-on installation dialog timer
  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  // Whitelist localhost
  addons.addToWhiteList(LOCAL_TEST_FOLDER);

  tabs.closeAllTabs(controller);
}

function teardownModule() {
  // Bug 867217
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("restartApplication" in controller) {
    controller.restartApplication();
  }
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
