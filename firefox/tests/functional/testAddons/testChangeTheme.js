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
const TIMEOUT_USER_SHUTDOWN = 2000;

const THEME = [
  {name: "Theme (Plain)",
   id: "plain.theme@quality.mozilla.org",
   url: BASE_URL + "addons/install.html?addon=themes/plain.jar"},
  {name: "Default",
   id: "{972ce4c6-7e08-4474-a285-3208198ce6fd}"}
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
 * Test installing a theme
 */
function testInstallTheme() {
  persisted.nextTest = "testThemeIsInstalled";

  // Go to theme url and perform install
  controller.open(THEME[0].url);
  controller.waitForPageLoad();

  var installLink = findElement.ID(controller.tabs.activeTab, "addon");
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  md.start(addons.handleInstallAddonDialog);
  installLink.click();
  md.waitForDialog(TIMEOUT_DOWNLOAD);

  addonsManager.open();

  // Set category to 'Appearance'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "theme"})
  });

  var plainTheme;
  assert.waitFor(() => {
    plainTheme = addonsManager.getAddons({attribute: "value",
                                          value: THEME[0].id})[0];
    return !!plainTheme;
  }, "New installed theme has been found.");

  // Verify that plain-theme is marked to be enabled
  assert.equal(plainTheme.getNode().getAttribute("pending"), "enable",
               "Plain-theme is marked to be enabled.");
}

/**
 * Verifies the theme is installed and enabled
 */
function testThemeIsInstalled() {
  persisted.nextTest = "testChangedThemeToDefault";

  addonsManager.open();

  // Verify the plain-theme is installed
  var plainTheme = addonsManager.getAddons({attribute: "value",
                                            value: THEME[0].id})[0];

  assert.ok(addonsManager.isAddonInstalled({addon: plainTheme}),
            "The theme '" + THEME[0].id + "' is installed");

  // Verify the plain-theme is enabled
  assert.ok(addonsManager.isAddonEnabled({addon: plainTheme}),
            "The theme '" + THEME[0].id + "' is enabled");

  // Enable the default theme
  var defaultTheme = addonsManager.getAddons({attribute: "value",
                                              value: THEME[1].id})[0];

  addonsManager.enableAddon({addon: defaultTheme});

  // Verify that default theme is marked to be enabled
  assert.equal(defaultTheme.getNode().getAttribute("pending"), "enable",
               "Default-theme is marked to be enabled.");
}

/**
 * Verify we changed to the default theme
 */
function testChangedThemeToDefault() {
  addonsManager.open();

  // Verify the default theme is active
  var defaultTheme = addonsManager.getAddons({attribute: "value",
                                              value: THEME[1].id})[0];

  assert.equal(defaultTheme.getNode().getAttribute("active"), "true");
}
