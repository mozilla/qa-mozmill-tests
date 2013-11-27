/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {assert} = require("../../../../lib/assertions");
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var tabs = require("../../../../lib/tabs");
var prefs = require("../../../../lib/prefs");

const TIMEOUT_DOWNLOAD = 25000;

const PREF_ADDONS_CACHE_ENABLED = "extensions.getAddons.cache.enabled";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";
const INSTALL_SOURCE = "discovery-promo";

function setupModule() {
  controller = mozmill.getBrowserController();
  am = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
  prefs.preferences.setPref(PREF_ADDONS_CACHE_ENABLED, "false");
}

function teardownModule() {
  prefs.preferences.clearUserPref(PREF_ADDONS_CACHE_ENABLED);
  prefs.preferences.clearUserPref(PREF_LAST_CATEGORY);

  am.close();
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
function handleInstallAddonDialog(controller) {
  // Wait for the install button is enabled before clicking on it
  var installButton = new elementslib.Lookup(controller.window.document,
                                             '/id("xpinstallConfirm")/anon({"anonid":"buttons"})' +
                                             '/{"dlgtype":"accept"}');

  assert.waitFor(function () {
    return !installButton.getNode().disabled;
  }, "Install button is enabled");

  controller.click(installButton);
}

// Bug 732353 - Disable all Discovery Pane tests
//              due to unpredictable web dependencies
setupModule.__force_skip__ = "Bug 732353 - Disable all Discovery Pane tests " +
                             "due to unpredictable web dependencies";
teardownModule.__force_skip__ = "Bug 732353 - Disable all Discovery Pane tests " +
                                "due to unpredictable web dependencies";
