/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource("../../../../data/");
const BLOCKLIST_URL = LOCAL_TEST_FOLDER + "addons/blocklist/" +
                      "hardblock_extension/blocklist.xml";

const ADDON = {
  name: "Test Extension (icons)",
  id: "test-icons@quality.mozilla.org",
  url: LOCAL_TEST_FOLDER + "addons/extensions/icons.xpi"
};

const PREF_BLOCKLIST = "extensions.blocklist.url";
const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  persisted.addon = ADDON;

  // Update extensions.blocklist.url pref to our blocklist
  prefs.preferences.setPref(PREF_BLOCKLIST, BLOCKLIST_URL);

  // Set pref for add-on installation dialog timer
  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  tabs.closeAllTabs(controller);
}

/*
 * Install the extension to be blocklisted
 */
function testInstallBlocklistedExtension() {
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  md.start(addons.handleInstallAddonDialog);
  controller.open(persisted.addon.url);
  md.waitForDialog(TIMEOUT_DOWNLOAD);
}
