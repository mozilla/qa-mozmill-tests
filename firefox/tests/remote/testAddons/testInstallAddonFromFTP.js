/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

const ADDON = {
  id: "test-empty@quality.mozilla.org",
  url: "ftp://ftp.mozqa.com/data/firefox/addons/extensions/empty.xpi"
};

function setupModule(aModule) {
  addons.setDiscoveryPaneURL("about:home");

  prefs.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);
}

function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);

  persisted.nextTest = null;
}

function teardownTest(aModule) {
  if (persisted.nextTest) {
    controller.restartApplication(persisted.nextTest);
  }
}

function teardownModule(aModule) {
  if (addonsManager.isOpen) {
    addonsManager.close();
  }

  prefs.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.clearUserPref(PREF_LAST_CATEGORY);

  delete persisted.nextTest;

  addons.resetDiscoveryPaneURL();
  aModule.controller.stopApplication(true);
}

/**
 * Installs an extension from FTP server
 */
function testInstallAddonFromFTP() {
  persisted.nextTest = "testAddonInstalled";

  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  // Install the extension
  md.start(addons.handleInstallAddonDialog);
  controller.open(ADDON.url);
  md.waitForDialog(TIMEOUT_DOWNLOAD);
}

/**
 * Verifies the extension is installed
 */
function testAddonInstalled() {
  addonsManager.open();
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  var addon = addonsManager.getAddons({attribute: "value",
                                       value: ADDON.id})[0];

  assert.ok(addonsManager.isAddonInstalled({addon: addon}),
            "Extension '" + ADDON.id + "' has been correctly installed");
}
