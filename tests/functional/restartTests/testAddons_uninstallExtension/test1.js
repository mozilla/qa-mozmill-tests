/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource("../../../../data/");

const ADDONS = [
  {id: "test-icons@quality.mozilla.org", 
   url: LOCAL_TEST_FOLDER + "addons/extensions/icons.xpi"},
  {id: "test-long-name@quality.mozilla.org",
   url: LOCAL_TEST_FOLDER + "addons/extensions/long-name.xpi"},
];

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  // Set pref for add-on installation dialog timer 
  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  // Whitelist add the local test folder
  addons.addToWhiteList(LOCAL_TEST_FOLDER);

  // Store the addons object in 'persisted.addons'
  persisted.addons = ADDONS;

  tabs.closeAllTabs(controller);
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
