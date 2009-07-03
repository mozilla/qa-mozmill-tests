/* * ***** BEGIN LICENSE BLOCK *****
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
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <hskupin@mozilla.com>
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
 * **** END LICENSE BLOCK ***** */

/**
 * Litmus test #5929: Install an extension
 */

// Include necessary modules
var RELATIVE_ROOT = '../../../shared-modules';
var MODULE_REQUIRES = ['ModalDialogAPI', 'UtilsAPI'];

// Shared variable
const gExtensionName = "Adblock Plus";

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  module.addonsController = mozmill.getAddonsController();
}

var teardownModule = function(module) {
  // Close all open tabs
  UtilsAPI.closeAllTabs(controller);
}

var testInstallExtension = function() {
  // Make sure only one tab is open
  UtilsAPI.closeAllTabs(controller);

  // Make sure the Get Add-ons pane is visible
  var getAddonsPane = new elementslib.ID(addonsController.window.document, "search-view");
  UtilsAPI.delayedClick(addonsController, getAddonsPane);

  // Wait for the Browse All Add-ons link and click on it
  var browseAddonsLink = new elementslib.ID(addonsController.window.document, "browseAddons");
  UtilsAPI.delayedClick(addonsController, browseAddonsLink);

  // The target web page is loaded lazily so wait for the newly created tab first
  controller.waitForEval("subject.length == 2", 5000, 100, controller.tabs);
  controller.waitForPageLoad(controller.tabs.activeTab);

  // To avoid a broken test lets install Adblock directly
  controller.open("https://addons.mozilla.org/de/firefox/addon/1865");
  controller.waitForPageLoad(controller.tabs.activeTab);

  // Create a modal dialog instance to handle the Software Installation dialog
  var md = new ModalDialogAPI.modalDialog(handleTriggerDialog);
  md.start();

  // Click the link to install the extension
  var triggerLink = new elementslib.XPath(controller.tabs.activeTab, "/html/body[@id='mozilla-com']/div/div[3]/div[@id='addon-summary']/div[1]/p[1]/a");
  UtilsAPI.delayedClick(controller, triggerLink);

  // Wait that the Installation pane is selected in the Add-ons Manager after the extension has been installed
  var installPane = new elementslib.ID(addonsController.window.document, "installs-view");
  addonsController.waitForEval("subject.selected == true", 10000, 100, installPane.getNode());

  // Check if the installed extension is visible in the Add-ons Manager
  var extension = new elementslib.Lookup(addonsController.window.document, '/id("extensionsManager")/id("addonsMsg")/id("extensionsBox")/[1]/id("extensionsView")/[1]/anon({"flex":"1"})/[0]/[1]/{"class":"addon-name-version","xbl:inherits":"name, version=newVersion"}/anon({"class":"addonName","crop":"end","xbl:inherits":"value=name","value":"' + gExtensionName + '"})');
  UtilsAPI.delayedAssertNode(addonsController, extension, 5000, 100);

  // Check if restart button is present
  var restartButton = new elementslib.XPath(addonsController.window.document, "/*[name()='window' and namespace-uri()='http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul']/*[name()='notificationbox' and namespace-uri()='http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'][1]/*[name()='notification' and namespace-uri()='http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'][1]/*[name()='button' and namespace-uri()='http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'][1]");
  UtilsAPI.delayedAssertNode(addonsController, restartButton);
}

/**
 * Handle the Software Installation dialog
 */
var handleTriggerDialog = function(controller) {
  // Get list of extensions which should be installed
  var itemList = controller.window.document.getElementById("itemList");
  UtilsAPI.delayedAssertNode(controller, new elementslib.Elem(controller.window.document, itemList));

  // There should be listed only one extension
  if (itemList.childNodes.length != 1) {
    throw "Expected one extension for installation";
  }

  // Check if the extension name is shown
  if (itemList.childNodes[0].name != gExtensionName) {
    throw "Visible extension name doesn't match target extension";
  }

  // Will the extension be installed from https://addons.mozilla.org/?
  if (itemList.childNodes[0].url.indexOf("https://addons.mozilla.org/") == -1) {
    throw "Extension location doesn't contain https://addons.mozilla.org/";
  }

  // Check if the Cancel button is present
  var cancelButton = new elementslib.Lookup(controller.window.document, '/id("xpinstallConfirm")/anon({"anonid":"buttons"})/{"dlgtype":"cancel"}');
  controller.assertNode(cancelButton);

  // Wait for the install button is enabled before clicking on it
  var installButton = new elementslib.Lookup(controller.window.document, '/id("xpinstallConfirm")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  controller.waitForEval("subject.disabled != true", 5000, 100, installButton.getNode());
  controller.click(installButton);
}
