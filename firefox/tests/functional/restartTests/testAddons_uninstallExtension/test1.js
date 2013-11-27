/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

"use strict";

const BASE_URL = collector.addHttpResource("../../../../../data/");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";

const INSTALL_DIALOG_DELAY = 250;
const TIMEOUT_DOWNLOAD = 25000;

const ADDONS = [
  {id: "test-icons@quality.mozilla.org",
   url: BASE_URL + "addons/extensions/icons.xpi"},
  {id: "test-long-name@quality.mozilla.org",
   url: BASE_URL + "addons/extensions/long-name.xpi"},
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  addons.setDiscoveryPaneURL("about:home");

  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  // Whitelist add the local test folder
  addons.addToWhiteList(BASE_URL);

  // Store the addons object in 'persisted.addons'
  persisted.addons = ADDONS;

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  // Bug 867217
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("restartApplication" in aModule.controller) {
    aModule.controller.restartApplication();
  }
}

/*
 * Install some add-ons to test uninstallation
 */
function testInstallExtensions() {
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  persisted.addons.forEach(function (addon) {
   // Install the addon
    md.start(addons.handleInstallAddonDialog);
    controller.open(addon.url);
    md.waitForDialog(TIMEOUT_DOWNLOAD);

    // Dispose of the restart doorhanger notification by keyboard event
    controller.keypress(null , 'VK_ESCAPE', {});
  });
}
