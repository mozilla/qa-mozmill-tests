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

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_INSTALL_SECURE = "extensions.install.requireSecureOrigin";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

const THEME = {
  name: "Theme (Plain)",
  id: "plain.theme@quality.mozilla.org",
  url: BASE_URL + "addons/install.html?addon=/themes/plain.jar"
};

function setupModule(aModule) {
  addons.setDiscoveryPaneURL("about:home");

  prefs.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);
  prefs.setPref(PREF_INSTALL_SECURE, false);

  // Whitelist add the AMO preview site
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
 * Test installing a theme
 */
function testInstallTheme() {
  persisted.nextTest = "testThemeIsInstalled";

  // Go to theme url and perform install
  controller.open(THEME.url);
  controller.waitForPageLoad();

  var installLink = findElement.ID(controller.tabs.activeTab, "addon");
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  md.start(addons.handleInstallAddonDialog);
  installLink.click();
  md.waitForDialog(TIMEOUT_DOWNLOAD);
}

/**
 * Test theme has been installed then uninstall
 */
function testThemeIsInstalled() {
  persisted.nextTest = "testThemeIsUninstalled";

  addonsManager.open();

  // Set category to 'Appearance'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "theme"})
  });

  // Verify the theme is installed
  var theme = addonsManager.getAddons({attribute: "value", value: THEME.id})[0];
  var themeIsInstalled = addonsManager.isAddonInstalled({addon: theme});

  assert.ok(themeIsInstalled, THEME.id + " is installed");

  // Remove theme
  addonsManager.removeAddon({addon: theme});
}

/**
 * Test that a theme has been uninstalled
 */
function testThemeIsUninstalled() {
  addonsManager.open();

  var theme = addonsManager.getAddons({attribute: "value",
                                       value: THEME.id});

  assert.equal(theme.length, 0, THEME.id + " is uninstalled");
}
