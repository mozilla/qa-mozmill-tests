/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var tabs = require("../../../../lib/tabs");

const ADDON = [
  {id: "test-empty@quality.mozilla.org",
   url: "ftp://ftp.mozqa.com/data/firefox/addons/extensions/empty.xpi"}
];

const TIMEOUT_DOWNLOAD = 25000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  // Store the extension data in the persisted object
  persisted.addon = ADDON[0];

  tabs.closeAllTabs(controller);
}

/*
 * Installs an extension from FTP server
 */
function testInstallAddonFromFTP() {
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  // Install the extension
  md.start(addons.handleInstallAddonDialog);
  controller.open(persisted.addon.url);
  md.waitForDialog(TIMEOUT_DOWNLOAD);
}
