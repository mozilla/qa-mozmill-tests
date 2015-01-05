/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var {assert} = require("../../../../../lib/assertions");
var addons = require("../../../../../lib/addons");
var modalDialog = require("../../../../../lib/modal-dialog");
var tabs = require("../../../../lib/tabs");
var prefs = require("../../../../../lib/prefs");

const PREF_ADDONS_CACHE_ENABLED = "extensions.getAddons.cache.enabled";
const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

const INSTALL_SOURCE = "discovery-promo";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.am = new addons.AddonsManager(aModule.controller);

  prefs.setPref(PREF_ADDONS_CACHE_ENABLED, "false");
  prefs.setPref(PREF_INSTALL_DIALOG, INSTALL_DIALOG_DELAY);

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_ADDONS_CACHE_ENABLED);
  prefs.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.clearUserPref(PREF_LAST_CATEGORY);

  aModule.am.close();
}

/**
 * Verifies installation of a First Time add-on
 */
function testInstallFirstTimeAddon() {
  am.open();

  // Select the Get Add-ons pane
  am.setCategory({category: am.getCategoryById({id: "discover"})});

  // Wait for the Get Add-ons pane to load
  var discovery = am.discoveryPane;
  discovery.waitForPageLoad();

  // Click on a random addon
  var feature = discovery.getSection("main-feature");
  var addonList = discovery.getElements({type: "mainFeature_firstTimeAddons", parent: feature});
  var randomIndex = Math.floor(Math.random() * addonList.length);
  var randomAddon = addonList[randomIndex];
  var addonId = randomAddon.getNode().getAttribute("data-guid");

  controller.click(randomAddon);
  discovery.waitForPageLoad();

  // Install the addon
  var addToFirefox = discovery.getElement({type: "addon_installButton"});
  var currentInstallSource = discovery.getInstallSource(addToFirefox);

  assert.equal(currentInstallSource, INSTALL_SOURCE,
               "Installation link has source set");

  var md = new modalDialog.modalDialog(am.controller.window);
  md.start(handleInstallAddonDialog);
  controller.click(addToFirefox);

  md.waitForDialog(TIMEOUT_DOWNLOAD);

  // Verify the addon is installed
  am.setCategory({category: am.getCategoryById({id: "extension"})});
  var addon = am.getAddons({attribute: "value", value: addonId})[0];

  assert.ok(am.isAddonInstalled({addon: addon}), "Add-on has been installed");
}

/**
 * Handle the modal dialog to install an addon
 */
function handleInstallAddonDialog(aController) {
  // Wait for the install button is enabled before clicking on it
  var installButton = new elementslib.Lookup(aController.window.document,
                                             '/id("xpinstallConfirm")/anon({"anonid":"buttons"})' +
                                             '/{"dlgtype":"accept"}');

  assert.waitFor(function () {
    return !installButton.getNode().disabled;
  }, "Install button is enabled");

  aController.click(installButton);
}
