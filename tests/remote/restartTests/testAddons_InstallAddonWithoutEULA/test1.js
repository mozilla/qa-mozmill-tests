/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var { assert } = require("../../../../lib/assertions");
var modalDialog = require("../../../../lib/modal-dialog");
var tabs = require("../../../../lib/tabs");

const ADDON = {
  name: "Nightly Tester Tools",
  url: "https://addons.mozilla.org/en-US/firefox/addon/nightly-tester-tools/"
};

const TIMEOUT_DOWNLOAD = 25000;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);

  persisted.addon = ADDON;
}

function teardownModule(aModule) {
  tabs.closeAllTabs(aModule.controller);

  // Bug 867217
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("restartApplication" in aModule.controller) {
    aModule.controller.restartApplication();
  }
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
}
