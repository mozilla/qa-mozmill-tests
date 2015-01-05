/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../../lib/addons");
var {assert, expect} = require("../../../../../lib/assertions");
var modalDialog = require("../../../../../lib/modal-dialog");
var prefs = require("../../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;
const TIMEOUT_SWITCH = 100;

const CLICK_COUNT = 3;
const INSTALL_SOURCE = "discovery-promo";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.am = new addons.AddonsManager(aModule.controller);

  prefs.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.clearUserPref(PREF_LAST_CATEGORY);

  delete persisted.currentAddon;

  aModule.am.close();
}

/**
 * Verifies that an addon from the Mozilla Pick of the month section can be installed
 */
function testInstallPickOfTheMonthAddon() {
  am.open();

  // Select the Get Add-ons pane
  am.setCategory({category: am.getCategoryById({id: "discover"})});
  var discovery = am.discoveryPane;
  discovery.waitForPageLoad();

  // Go to Mozilla's pick of the Month panel
  // Bug 666530
  // Add a property or attribute on "main-feature" which changes when clicking
  // next/prev buttons - currently we are clicking the third subsection without
  // checking if it is the right one
  var section = discovery.getSection("main-feature");
  var nextLink = discovery.getElement({type: "mainFeature_nextLink", parent: section});

  for (var i = 0; i < CLICK_COUNT; i++) {
    controller.click(nextLink);
    controller.sleep(TIMEOUT_SWITCH);
  }

  // Install the addon
  var addToFirefox = discovery.getElement({type: "addon_installButton", parent: section});

  // Retrieve addon src parameter from installation link
  var currentInstallSource = discovery.getInstallSource(addToFirefox);

  assert.equal(currentInstallSource, INSTALL_SOURCE,
               "Installation link has source set");

  var md = new modalDialog.modalDialog(am.controller.window);
  md.start(addons.handleInstallAddonDialog);
  controller.click(addToFirefox);

  md.waitForDialog(TIMEOUT_DOWNLOAD);

  // Verify the addon is installed
  am.setCategory({category: am.getCategoryById({id: "extension"})});

  var addon = am.getAddons({attribute: "name", value: persisted.currentAddon})[0];

  assert.ok(am.isAddonInstalled({addon: addon}), "Add-on has been installed");
}
