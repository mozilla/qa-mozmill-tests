/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var { assert } = require("../../../../lib/assertions");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");
var toolbars = require("../../../../lib/toolbars");

const TIMEOUT_DOWNLOAD = 25000;

const LOCAL_INSTALL_FILE = "install.html?addon="
const LOCAL_TEST_FOLDER = collector.addHttpResource("../../../../data/addons/");

const PREF_UPDATE_EXTENSION = "extensions.update.enabled";

const ADDONS = [
  {id: "test-empty@quality.mozilla.org",
   url: LOCAL_TEST_FOLDER + LOCAL_INSTALL_FILE + "extensions/empty.xpi"},
  {id: "test-icons@quality.mozilla.org",
   url: LOCAL_TEST_FOLDER + LOCAL_INSTALL_FILE + "extensions/icons.xpi"}
];


function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);
  locationBar = new toolbars.locationBar(controller);
  prefs.preferences.setPref(PREF_UPDATE_EXTENSION, false);

  // Whitelist add localhost
  addons.addToWhiteList(LOCAL_TEST_FOLDER);

  // Store the addons object in 'persisted.addons'
  persisted.addons = ADDONS;

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

    var notification = locationBar.getNotification();
    assert.waitFor(function () {
      return notification.getNode().state === "open";
    }, "Notification pop-up has been opened");

    controller.keypress(null , 'VK_ESCAPE', {});

    assert.waitFor(function () {
      return notification.getNode().state === "closed";
    }, "Notification pop-up has been closed");
  });
}
