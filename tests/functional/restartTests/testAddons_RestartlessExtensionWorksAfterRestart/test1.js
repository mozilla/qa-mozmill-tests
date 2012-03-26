/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var modalDialog = require("../../../../lib/modal-dialog");
var tabs = require("../../../../lib/tabs");

const LOCAL_INSTALL_FILE = "install.html?addon=";
const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../../data/addons/');

const ADDON = {
  id: "restartless-addon@quality.mozilla.org",
  url: LOCAL_TEST_FOLDER + LOCAL_INSTALL_FILE + "extensions/restartless.xpi"
};

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  // Whitelist add the localhost
  addons.addToWhiteList(LOCAL_TEST_FOLDER);
  
  tabs.closeAllTabs(controller);
}

/**
 * Test installing a restartless addon
 */
function testInstallRestartlessExtension() {
  persisted.addon = ADDON;

  // Install the addon
  controller.open(ADDON.url);
  controller.waitForPageLoad();

  var installLink = new elementslib.ID(controller.tabs.activeTab, "addon");
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  md.start(addons.handleInstallAddonDialog);
  controller.click(installLink);
  md.waitForDialog(); 

  addonsManager.open();

  // Set category to 'Extensions'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  // Verify the addon is installed
  var anAddon = addonsManager.getAddons({attribute: "value", value: ADDON.id})[0];
  var addonIsInstalled = addonsManager.isAddonInstalled({addon: anAddon});

  assert.ok(addonIsInstalled, ADDON.id + " is successfully installed");
}

// Bug 719982 - Failure in testAddons_RestartlessExtensionWorksAfterRestart | 
//              Modal dialog has been found and processed
setupModule.__force_skip__ = "Bug 719982 - Failure in testAddons_RestartlessExtensionWorksAfterRestart " +
                             " | Modal dialog has been found and processed";
