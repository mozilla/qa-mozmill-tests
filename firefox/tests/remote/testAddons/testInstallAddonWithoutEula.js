/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_XPI_WHITELIST = "xpinstall.whitelist.add";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

const ADDON = {
  name: "Nightly Tester Tools",
  url: "https://addons.mozilla.org/en-US/firefox/addon/nightly-tester-tools/"
};

function setupModule(aModule) {
  prefs.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);
  addons.setDiscoveryPaneURL("about:home");
}

function setupTest(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

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
  prefs.clearUserPref(PREF_LAST_CATEGORY);

  // Bug 951138
  // Mozprofile doesn't clear this pref while it is clearing all permissions
  prefs.clearUserPref(PREF_XPI_WHITELIST);

  tabs.closeAllTabs(aModule.controller);
  delete persisted.nextTest;

  addons.resetDiscoveryPaneURL();
  aModule.controller.stopApplication(true);
}

/**
 * Installs an Addon without EULA from addons.mozilla.org
 */
function testInstallAddonWithEULA() {
  persisted.nextTest = "testCheckAddonIsInstalled";

  controller.open(ADDON.url);
  controller.waitForPageLoad();

  var addonPage = new addons.AMOAddonPage(controller);
  var addButton = addonPage.getElement({type: "install-button"});
  var md = new modalDialog.modalDialog(controller.window);

  // Install the add-on
  md.start(aController => addons.handleInstallAddonDialog(aController));

  // Wait for installing notification to appear
  locationBar.waitForNotificationPanel(() => {
    expect.waitFor(() => utils.isDisplayed(controller, addButton),
                   "Add extension to Firefox button is ready");
    addButton.click();
  }, {type: "notification"});

  // Install the addon and wait for the 'addon-install-complete' notification to show
  locationBar.waitForNotificationPanel(() => {
    md.waitForDialog(TIMEOUT_DOWNLOAD);
  }, {type: "notification"});

  // Dispose of the restart doorhanger notification by keyboard event
  locationBar.waitForNotificationPanel(panel => panel.keypress('VK_ESCAPE', {}),
                                       {type: "notification", open:false});
}

/**
 * Test check if the addon is correctly installed
 */
function testCheckAddonIsInstalled() {
  // Open the Add-ons Manager
  addonsManager.open();

  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  // Verify the add-on is installed
  var addon = addonsManager.getAddons({attribute: "name",
                                       value: ADDON.name})[0];
  assert.ok(addonsManager.isAddonInstalled({addon: addon}),
            "The add-on has been correctly installed");
}
