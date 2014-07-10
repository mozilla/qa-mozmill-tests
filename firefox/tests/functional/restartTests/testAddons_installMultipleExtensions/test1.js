/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../../lib/addons");
var { assert } = require("../../../../../lib/assertions");
var modalDialog = require("../../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");
var toolbars = require("../../../../lib/toolbars");

const BASE_URL = collector.addHttpResource("../../../../../data/");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

const ADDONS = [
  {id: "test-empty@quality.mozilla.org",
   url: BASE_URL + "addons/install.html?addon=extensions/empty.xpi"},
  {id: "test-icons@quality.mozilla.org",
   url: BASE_URL + "addons/install.html?addon=extensions/icons.xpi"}
];


function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  addons.setDiscoveryPaneURL("about:home");

  aModule.locationBar = new toolbars.locationBar(aModule.controller);

  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  // Whitelist add localhost
  addons.addToWhiteList(BASE_URL + "addons/");

  // Store the addons object in 'persisted.addons'
  persisted.addons = ADDONS;

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  aModule.controller.restartApplication();
}

/**
 * Installs multiple addons
 */
function testInstallMultipleExtensions() {
  persisted.addons.forEach(function(addon) {
    // Open the addon page
    controller.open(addon.url);
    controller.waitForPageLoad();

    var md = new modalDialog.modalDialog(addonsManager.controller.window);
    md.start(aController => {
      // Wait for the 'addon-install-complete' notification to show
      locationBar.waitForNotificationPanel(() => {
        addons.handleInstallAddonDialog(aController);
      }, {type: "notification"});
    });

    locationBar.waitForNotificationPanel(() => {
      var installLink = findElement.ID(controller.tabs.activeTab, "addon");
      installLink.click();
    }, {type: "notification"});

    md.waitForDialog(TIMEOUT_DOWNLOAD);

    // Wait for the notification to unload
    locationBar.waitForNotificationPanel(panel => {
      panel.keypress('VK_ESCAPE', {});
    }, {type: "notification", open: false});
  });
}
