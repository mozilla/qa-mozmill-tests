/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");

const TIMEOUT_DOWNLOAD = 25000;

const PREF_UPDATE_EXTENSION = "extensions.update.enabled";

const ADDONS = [
  {id: "test-empty@quality.mozilla.org",
   url: BASE_URL + "addons/install.html?addon=extensions/empty.xpi"},
  {id: "test-icons@quality.mozilla.org",
   url: BASE_URL + "addons/install.html?addon=extensions/icons.xpi"}
];


function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  prefs.preferences.setPref(PREF_UPDATE_EXTENSION, false);

  // Whitelist add localhost
  addons.addToWhiteList(BASE_URL + "addons/");

  // Store the addons object in 'persisted.addons'
  persisted.addons = ADDONS;

  tabs.closeAllTabs(aModule.controller);
}

/**
 * Installs multiple addons
 */
function testInstallMultipleExtensions() {
  persisted.addons.forEach(function(addon) {
    // Open the addon page
    controller.open(addon.url);
    controller.waitForPageLoad();

    var installLink = new elementslib.ID(controller.tabs.activeTab, "addon");
    var md = new modalDialog.modalDialog(addonsManager.controller.window);

    // Install the addon
    md.start(addons.handleInstallAddonDialog);
    controller.click(installLink);
    md.waitForDialog(TIMEOUT_DOWNLOAD);
    controller.keypress(null , 'VK_ESCAPE', {});
  });
}
