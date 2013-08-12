/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../lib/addons");
var { assert } = require("../../../lib/assertions");
var modalDialog = require("../../../lib/modal-dialog");
var tabs = require("../../../lib/tabs");

const ADDON = {
  name: "Nightly Tester Tools",
  url: "https://addons.mozilla.org/en-US/firefox/addon/nightly-tester-tools/"
};

const TIMEOUT_DOWNLOAD = 25000;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  aModule.addonsManager.close();
  tabs.closeAllTabs(aModule.controller);
}

/**
 * Installs an Addon without EULA from addons.mozilla.org
 */
function testInstallAddonWithEULA() {
  controller.open(ADDON.url);
  controller.waitForPageLoad();

  var addonPage = new addons.AMOAddonPage(controller);
  var addButton = addonPage.getElement({type: "install-button"});
  var md = new modalDialog.modalDialog(controller.window);

  // Install the add-on
  md.start(addons.handleInstallAddonDialog);
  controller.click(addButton);
  md.waitForDialog(TIMEOUT_DOWNLOAD);

  // Open the Add-ons Manager
  addonsManager.open();
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  // Verify the add-on is installed
  var addon = addonsManager.getAddons({attribute: "name", value: ADDON.name})[0];
  assert.ok(addonsManager.isAddonInstalled({addon: addon}),
            "The add-on has been correctly installed");
}
