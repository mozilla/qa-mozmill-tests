/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Alex Lakatos <alex.lakatos@softvision.ro> (original author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Include required modules
var addons = require("../../../../lib/addons");
var modalDialog = require("../../../../lib/modal-dialog");
var tabs = require("../../../../lib/tabs");
var prefs = require("../../../../lib/prefs");

const TIMEOUT_DOWNLOAD = 25000;

const PREF_ADDONS_CACHE_ENABLED = "extensions.getAddons.cache.enabled";
const INSTALL_SOURCE = "discovery-promo";

function setupModule() {
  controller = mozmill.getBrowserController();
  am = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
  prefs.preferences.setPref(PREF_ADDONS_CACHE_ENABLED, "false");
}

function teardownModule() {
  prefs.preferences.clearUserPref(PREF_ADDONS_CACHE_ENABLED);
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

  controller.assert(function () {
    return currentInstallSource === INSTALL_SOURCE;
  }, "Installation link has source set - got '" + currentInstallSource +
     "', expected '" + INSTALL_SOURCE + "'");

  var md = new modalDialog.modalDialog(am.controller.window);
  md.start(handleInstallAddonDialog);
  controller.click(addToFirefox);

  md.waitForDialog(TIMEOUT_DOWNLOAD);

  // Verify the addon is installed
  am.setCategory({category: am.getCategoryById({id: "extension"})});
  var addon = am.getAddons({attribute: "value", value: addonId})[0];
  var addonIsInstalled = am.isAddonInstalled({addon: addon});

  controller.assert(function () {
    return addonIsInstalled;
  }, "Add-on has been installed - got '" + addonIsInstalled + 
      "', expected 'true'");
}

/**
 * Handle the modal dialog to install an addon
 */
function handleInstallAddonDialog(controller) {
  // Wait for the install button is enabled before clicking on it
  var installButton = new elementslib.Lookup(controller.window.document, 
                                             '/id("xpinstallConfirm")/anon({"anonid":"buttons"})' +
                                             '/{"dlgtype":"accept"}');

  controller.waitFor(function () {
    return !installButton.getNode().disabled; 
  }, "Install button is enabled: got '" + !installButton.getNode().disabled + 
      "', expected 'true'");

  controller.click(installButton);
}

