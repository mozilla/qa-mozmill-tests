/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../../lib/assertions");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

const INSTALL_DIALOG_DELAY = 250;
const TIMEOUT_DOWNLOAD = 25000;

const ADDON = {
  name: "Echofon",
  page: "https://services.addons.mozilla.org/en-US/firefox/" +
        "discovery/addon/echofon-for-twitter/?src=discovery-featured"
};

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  prefs.preferences.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  prefs.preferences.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.preferences.clearUserPref(PREF_LAST_CATEGORY);

  aModule.addonsManager.close();
}

/**
 * Tests installation of EULA add-on
 *
 * Bug 678478
 * Retrieving the add-on by direct access of its detailed page because
 * at the moment we can't predict that any of the sections will provide
 * an add-on with EULA
 */
function testInstallAddonWithEULA() {
  // Retrieve add-on via production page
  controller.open(ADDON.page);
  controller.waitForPageLoad();

  // Bug 680045
  // Add elements to UI map for add-ons with EULA
  var continueToDownloadLink = new elementslib.Selector(controller.window.document,
                                                        ".install-action");

  // Click on continue to download link
  controller.click(continueToDownloadLink);
  controller.waitForPageLoad();

  var acceptAndInstallButton = new elementslib.Selector(controller.window.document,
                                                        ".install-button");
  var md = new modalDialog.modalDialog(addonsManager.controller.window);

  // Install the add-on
  md.start(addons.handleInstallAddonDialog);
  controller.click(acceptAndInstallButton);
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

setupModule.__force_skip__ = "Bug 658369 - 'Echofon' add-on is not compatible" +
                             "with Firefox Nightly, Aurora and Beta builds";
teardownModule.__force_skip__ = "Bug 658369 - 'Echofon' add-on is not compatible" +
                                "with Firefox Nightly, Aurora and Beta builds";
