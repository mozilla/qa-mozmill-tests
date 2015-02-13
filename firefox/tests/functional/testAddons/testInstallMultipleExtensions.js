/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_INSTALL_SECURE = "extensions.install.requireSecureOrigin";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

const ADDONS = [
  {id: "test-empty@quality.mozilla.org",
   url: BASE_URL + "addons/install.html?addon=extensions/empty.xpi"},
  {id: "test-icons@quality.mozilla.org",
   url: BASE_URL + "addons/install.html?addon=extensions/icons.xpi"}
];

function setupModule(aModule) {
  addons.setDiscoveryPaneURL("about:home");

  prefs.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);
  prefs.setPref(PREF_INSTALL_SECURE, false);

  // Whitelist add localhost
  addons.addToWhiteList(BASE_URL + "addons/");
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
  prefs.clearUserPref(PREF_INSTALL_SECURE);
  prefs.clearUserPref(PREF_LAST_CATEGORY);

  delete persisted.nextTest;

  addons.resetDiscoveryPaneURL();
  aModule.controller.stopApplication(true);
}

/**
 * Installs multiple addons
 */
function testInstallMultipleExtensions() {
  persisted.nextTest = "testCheckMultipleExtensionsAreInstalled";

  ADDONS.forEach(function(aAddon) {
    // Open the addon page
    controller.open(aAddon.url);
    controller.waitForPageLoad();

    var md = new modalDialog.modalDialog(addonsManager.controller.window);
    md.start(aController => addons.handleInstallAddonDialog(aController));

    var callback = () => {
      // Wait for installing notification to appear
      locationBar.waitForNotificationPanel(() => {
        var installLink = findElement.ID(controller.tabs.activeTab, "addon");
        installLink.click();
      }, {type: "notification"});

      // Wait for 'Software Installation' dialog to be handled
      md.waitForDialog(TIMEOUT_DOWNLOAD);
    }

    // Install the addon and wait for the 'addon-install-complete' notification to show
    locationBar.waitForNotificationPanel(callback, {type: "notification"});

    // Wait for the notification to unload
    locationBar.waitForNotificationPanel(panel => {
      panel.keypress('VK_ESCAPE', {});
    }, {type: "notification", open: false});

    // Dispose of the restart doorhanger notification
    controller.keypress(null , 'VK_ESCAPE', {});
  });
}

/**
 * Verifies the addons are installed
 */
function testCheckMultipleExtensionsAreInstalled() {
  addonsManager.open();
  var category =  addonsManager.getCategoryById({id: "extension"});
  addonsManager.setCategory({category:category});

  ADDONS.forEach(function(aAddon) {
    // Verify the addons are installed
    var addon = addonsManager.getAddons({attribute: "value", value: aAddon.id})[0];
    var addonIsInstalled = addonsManager.isAddonInstalled({addon: addon});

    expect.ok(addonIsInstalled, "Add-on has been installed");
  });
}
