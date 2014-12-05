/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var {assert} = require("../../../../../lib/assertions");
var addons = require("../../../../../lib/addons");
var modalDialog = require("../../../../../lib/modal-dialog");
var prefs = require("../../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

const INSTALL_DIALOG_DELAY = 1000;
const TIMEOUT_DOWNLOAD = 25000;

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

  aModule.am.close();
}

/**
 * Verifies installation of an add-on from the Collections pane
 */
function testInstallCollectionAddon() {
  am.open();

  // Select the Get Add-ons pane
  am.setCategory({category: am.getCategoryById({id: "discover"})});

  var discovery = am.discoveryPane;
  discovery.waitForPageLoad();

  // Go to Collections pane
  var section = discovery.getSection("main-feature");
  var nextLink = discovery.getElement({type: "mainFeature_nextLink", parent: section});

  controller.click(nextLink);
  discovery.waitForPageLoad();

  // Click on a random addon
  var addonList = discovery.getElements({type: "mainFeature_collectionAddons",
                                       parent: section});
  var randomIndex = Math.floor(Math.random() * addonList.length);
  var randomAddon = addonList[randomIndex];
  var addonId = randomAddon.getNode().getAttribute("data-guid");

  controller.click(randomAddon);
  discovery.waitForPageLoad(TIMEOUT_DOWNLOAD);

  // Install the addon
  var addToFirefox = discovery.getElement({type: "addon_installButton"});

  // Retrieve addon src parameter from installation link
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
                                             '/id("xpinstallConfirm")' +
                                             '/anon({"anonid":"buttons"})' +
                                             '/{"dlgtype":"accept"}');
  assert.waitFor(function(){
    return !installButton.getNode().disabled;
  }, "Install button is enabled");

  aController.click(installButton);
}
