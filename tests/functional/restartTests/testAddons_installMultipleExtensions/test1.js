/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var tabs = require("../../../../lib/tabs");

const TIMEOUT_DOWNLOAD = 25000;

const LOCAL_INSTALL_FILE = "install.html?addon="
const LOCAL_TEST_FOLDER = collector.addHttpResource("../../../../data/addons/");

const ADDONS = [
  {id: "test-empty@quality.mozilla.org",
   url: LOCAL_TEST_FOLDER + LOCAL_INSTALL_FILE + "extensions/empty.xpi"},
  {id: "test-icons@quality.mozilla.org",
   url: LOCAL_TEST_FOLDER + LOCAL_INSTALL_FILE + "extensions/icons.xpi"}
];


function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  // Whitelist add localhost
  addons.addToWhiteList(LOCAL_TEST_FOLDER);

  // Store the addons object in 'persisted.addons'
  persisted.addons = ADDONS;

  tabs.closeAllTabs(controller);
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

// Bug 701908 - restartTests/testAddons_installMultipleExtensions causing a hang in testruns
setupModule.__force_skip__ = "Bug 701908 - restartTests/testAddons_installMultipleExtensions " +
                             "causing a hang in testruns";
