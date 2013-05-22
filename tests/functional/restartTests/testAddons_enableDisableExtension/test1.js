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

const ADDON = {
  url: BASE_URL + "addons/extensions/icons.xpi",
  id: "test-icons@quality.mozilla.org"
};

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  prefs.preferences.setPref(PREF_UPDATE_EXTENSION, false);

  // Store the addon in the persisted object
  persisted.addon = ADDON;

  tabs.closeAllTabs(aModule.controller);
}

/*
 * Install the add-on from data/ folder
 */
function testInstallAddon() {
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  // Install the add-on
  md.start(addons.handleInstallAddonDialog);
  controller.open(persisted.addon.url);
  md.waitForDialog(TIMEOUT_DOWNLOAD);
}
