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
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
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
 * ***** END LICENSE BLOCK ***** */

// Include necessary modules
var RELATIVE_ROOT = '../../../shared-modules';
var MODULE_REQUIRES = ['AddonsAPI', 'ModalDialogAPI', 'UtilsAPI'];

const gTimeout = 5000;

var setupModule = function(module) 
{
  module.controller = mozmill.getBrowserController();
  module.addonsManager = new AddonsAPI.addonsManager();

  module.persisted.extensionName = "Adblock Plus";
  module.persisted.extensionId = "{d10d0bf8-f5b5-c8b4-a8b2-2b9879e08c5d}";
}

var teardownModule = function(module)
{
  module.addonsManager.close();
}

/*
 * Tests the installation of an add-on through the add-ons manager
 */
var testInstallExtension = function()
{
  // Open the addons manager
  addonsManager.open(controller);

  var addonsController = addonsManager.controller;

  // Search for the addon mentioned in extensionName
  addonsManager.search(persisted.extensionName);

  // Wait for search results to populate and click on the install addon button for extensionName
  var footerField = new elementslib.ID(addonsController.window.document, "urn:mozilla:addons:search:status:footer");
  addonsController.waitForElement(footerField, 30000);

  // Select the extension we have searched for
  var extension = new elementslib.Lookup(addonsController.window.document,
                                         addonsManager.getListItem("addonID", persisted.extensionId));
  addonsController.click(extension);

  // XXX: Until bug 534070 is fixed, this is the work-around that we can provide to grab the install button
  var installButton = new elementslib.Elem(extension.getNode().boxObject.firstChild.childNodes[1]
                                           .childNodes[1].childNodes[1].childNodes[3].childNodes[7]);

  // Create a modal dialog instance to handle the Software Installation dialog
  var md = new ModalDialogAPI.modalDialog(handleTriggerDialog);
  md.start();

  // The installation is triggered lazily...
  addonsController.waitThenClick(installButton);

  // Check if the extension is visible in the installation pane
  addonsManager.setPane("installs");
  extension = new elementslib.Lookup(addonsController.window.document,
                                     addonsManager.getListItem("addonID", persisted.extensionId));
  addonsController.waitForElement(extension, 30000);
  addonsController.waitForEval("subject.getAttribute('state') == 'success'",
                               30000, 100, extension.getNode());

  // so we have to wait a bit longer for the restart button
  var restartButton = new elementslib.XPath(addonsController.window.document, "/*[name()='window']/*[name()='notificationbox'][1]/*[name()='notification'][1]/*[name()='button'][1]");
  addonsController.waitForElement(restartButton, gTimeout);
}

/**
 * Handle the Software Installation dialog
 */
var handleTriggerDialog = function(controller) 
{
  // Get list of extensions which should be installed
  var itemElem = controller.window.document.getElementById("itemList");
  var itemList = new elementslib.Elem(controller.window.document, itemElem);
  controller.waitForElement(itemList, gTimeout);

  // There should be listed only one extension
  if (itemElem.childNodes.length != 1) {
    throw new Error("Expected one extension for installation");
  }

  // Check if the extension name is shown
  if (itemElem.childNodes[0].name != persisted.extensionName) {
    throw new Error("Visible extension name doesn't match target extension");
  }

  // Will the extension be installed from https://addons.mozilla.org/?
  if (itemElem.childNodes[0].url.indexOf("https://addons.mozilla.org/") == -1) {
    throw new Error("Extension location doesn't contain https://addons.mozilla.org/");
  }

  // Check if the Cancel button is present
  var cancelButton = new elementslib.Lookup(controller.window.document, '/id("xpinstallConfirm")/anon({"anonid":"buttons"})/{"dlgtype":"cancel"}');
  controller.assertNode(cancelButton);

  // Wait for the install button is enabled before clicking on it
  var installButton = new elementslib.Lookup(controller.window.document, '/id("xpinstallConfirm")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  controller.waitForEval("subject.disabled != true", 7000, 100, installButton.getNode());
  controller.click(installButton);
}

/**
 * Map test functions to litmus tests
 */
testInstallExtension.meta = {litmusids : [6799]};
