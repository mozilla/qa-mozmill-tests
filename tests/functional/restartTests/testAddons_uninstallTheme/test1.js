/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

const PREF_UPDATE_EXTENSION = "extensions.update.enabled";

const TIMEOUT_DOWNLOAD = 25000;

const THEME = {
  name: "Theme (Plain)",
  id: "plain.theme@quality.mozilla.org",
  url: BASE_URL + "addons/install.html?addon=/themes/plain.jar"
};

function setupModule() {
  controller = mozmill.getBrowserController();

  prefs.preferences.setPref(PREF_UPDATE_EXTENSION, false);

  addonsManager = new addons.AddonsManager(controller);
  addons.setDiscoveryPaneURL(TEST_DATA);

  // Whitelist add the AMO preview site
  addons.addToWhiteList(BASE_URL);

  // Store the theme in the persisted object
  persisted.theme = THEME;

  tabs.closeAllTabs(controller);
}

function teardownModule() {
  // Bug 867217
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("restartApplication" in controller) {
    controller.restartApplication();
  }
}

/**
 * Test installing a theme
 */
function testInstallTheme() {
  // Go to theme url and perform install
  controller.open(persisted.theme.url);
  controller.waitForPageLoad();

  var installLink = new elementslib.ID(controller.tabs.activeTab, "addon");
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  md.start(addons.handleInstallAddonDialog);
  controller.click(installLink);
  md.waitForDialog(TIMEOUT_DOWNLOAD);
}
