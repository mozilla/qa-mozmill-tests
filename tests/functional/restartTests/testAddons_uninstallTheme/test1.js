/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var tabs = require("../../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../../data/');
const TIMEOUT_DOWNLOAD = 25000;

const THEME = {
  name: "Theme (Plain)",
  id: "plain.theme@quality.mozilla.org",
  url: LOCAL_TEST_FOLDER + "addons/install.html?addon=/themes/plain.jar"
};

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  // Whitelist add the AMO preview site
  addons.addToWhiteList(LOCAL_TEST_FOLDER);

  // Store the theme in the persisted object
  persisted.theme = THEME;

  tabs.closeAllTabs(controller);
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
