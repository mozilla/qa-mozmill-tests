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
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Remus Pop <remus.pop@softvision.ro>
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

const gTimeout = 5000;
const gSearchTimeout = 30000;

const TIMEOUT_INSTALL_DIALOG = 30000;
const TIMEOUT_INSTALLATION = 30000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();
  addonsManager = new addons.addonsManager();

  persisted.extensionName = "Nightly Tester Tools";
  persisted.extensionId = "{8620c15f-30dc-4dba-a131-7c5d20cf4a29}";

  // Store the AMO preview site
  persisted.amoPreviewSite = addons.AMO_PREVIEW_SITE;

  addons.useAmoPreviewUrls();
}

var teardownModule = function(module)
{
  addons.resetAmoPreviewUrls();
}

/*
 * Tests the installation of an add-on through the add-ons manager
 */
var testInstallExtension = function()
{
  // Open the addons manager
  addonsManager.open(controller);

  // Search for the addon mentioned in extensionName
  addonsManager.search(persisted.extensionName);

  // Wait for search results to populate and click on the install addon button for extensionName
  var footer = addonsManager.getElement({type: "search_status", subtype: "footer"});
  addonsManager.controller.waitForElement(footer, gSearchTimeout);

  // Select the extension we have searched for
  var extension = addonsManager.getListboxItem("addonID", persisted.extensionId);
  addonsManager.controller.waitThenClick(extension, gSearchTimeout);

  // Create a modal dialog instance to handle the Software Installation dialog
  var md = new modalDialog.modalDialog(addonsManager.controller.window);
  md.start(handleTriggerDialog);

  // Trigger the extension installation
  var installButton = addonsManager.getElement({type: "listbox_button",
                                                subtype: "installSearchResult",
                                                value: extension});
  addonsManager.controller.waitThenClick(installButton);
  md.waitForDialog(TIMEOUT_INSTALL_DIALOG);

  addonsManager.controller.waitFor(function () {
    action = extension.getNode().getAttribute('action');
    return addonsManager.paneId === 'installs' || action === 'installing';
  }, "Installation pane has been selected or the extension is installing");
  addonsManager.paneId = "installs";

  // ... and that the installation has been finished
  extension = addonsManager.getListboxItem("addonID", persisted.extensionId);
  addonsManager.controller.waitForElement(extension, TIMEOUT_INSTALLATION);
  addonsManager.controller.waitFor(function () {
    return extension.getNode().getAttribute('state') === 'success';
  }, "The extension has been installed");

  // Check if restart button is present
  var restartButton = addonsManager.getElement({type: "notificationBar_buttonRestart"});
  addonsManager.controller.waitForElement(restartButton, gTimeout);
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
  controller.assertJS("subject.extensionsCount == 1",
                      {extensionsCount: itemElem.childNodes.length});

  // Check if the extension name is shown
  controller.assertJS("subject.extensions[0].name == subject.targetName",
                      {extensions: itemElem.childNodes, targetName: persisted.extensionName});

  // Will the extension be installed from the original domain
  controller.assertJS("subject.isExtensionFromAMO == true",
                      {isExtensionFromAMO: itemElem.childNodes[0].url.indexOf(persisted.amoPreviewSite) != -1});

  // Check if the Cancel button is present
  var cancelButton = new elementslib.Lookup(controller.window.document,
                                            '/id("xpinstallConfirm")/anon({"anonid":"buttons"})/{"dlgtype":"cancel"}');
  controller.assertNode(cancelButton);

  // Wait for the install button is enabled before clicking on it
  var installButton = new elementslib.Lookup(controller.window.document,
                                             '/id("xpinstallConfirm")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  controller.waitFor(function () {
    return !installButton.getNode().disabled;
  }, "The Install button has been enabled", 7000, 100);
  controller.click(installButton);
}
