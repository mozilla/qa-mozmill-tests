/* ****** BEGIN LICENSE BLOCK *****
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
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Aakash Desai <adesai@mozilla.com>
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

/**
 * Litmus test #7972: Install an extension
 */

// Include necessary modules
var RELATIVE_ROOT = '../../../shared-modules';
var MODULE_REQUIRES = ['ModalDialogAPI', 'UtilsAPI'];

const gTimeout = 5000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();

  // Check if Add-ons Manager is opened after restart
  var window = mozmill.wm.getMostRecentWindow('Extension:Manager');
  module.addonsController = new mozmill.controller.MozMillController(window);
}

var testCheckInstalledExtension = function() 
{
  // Extensions pane should be selected
  var extensionsPane = new elementslib.ID(addonsController.window.document, "extensions-view");
  addonsController.waitForEval("subject.selected == true", gTimeout, 100, extensionsPane.getNode());

  // Notification bar should show one new installed extension
  var notificationBar = new elementslib.Lookup(addonsController.window.document, '/id("extensionsManager")/id("addonsMsg")/{"type":"warning"}/anon({"type":"warning"})/anon({"anonid":"details"})/anon({"anonid":"messageText"})');
  addonsController.waitForElement(notificationBar, gTimeout);

  // The installed extension should be displayed with a different background in the list.
  // We can find it by the attribute "newAddon"
  // XXX: Use a hard-coded name to access the entry directly until we can pass the info
  // between restart test files (bug 500987)
  var extension = new elementslib.Lookup(addonsController.window.document, '/id("extensionsManager")/id("addonsMsg")/id("extensionsBox")/[1]/id("extensionsView")/anon({"newAddon":"true"})/anon({"flex":"1"})/{"class":"addonTextBox"}/anon({"anonid":"addonNameVersion"})/anon({"value":"' + persisted.extensionName + '"})');
  addonsController.assertNode(extension);
}

/*
 * Tests the uninstallation of the extension
 */
var testUninstallExtension = function() 
{
  // Confirm the installed extension and click on it
  var extension = new elementslib.Lookup(addonsController.window.document, '/id("extensionsManager")/id("addonsMsg")/id("extensionsBox")/[1]/id("extensionsView")/anon({"newAddon":"true"})/anon({"flex":"1"})/{"class":"addonTextBox"}/anon({"anonid":"addonNameVersion"})/anon({"value":"' + persisted.extensionName + '"})');
  addonsController.click(extension);

  // Create a modal dialog instance to handle the software uninstallation dialog
  var md = new ModalDialogAPI.modalDialog(handleTriggerDialog);
  md.start();

  var uninstallExtensionButton = new elementslib.Lookup(addonsController.window.document, '/id("extensionsManager")/id("addonsMsg")/id("extensionsBox")/[1]/id("extensionsView")/anon({"newAddon":"true"})/anon({"flex":"1"})/{"class":"addonTextBox"}/anon({"anonid":"selectedButtons"})/{"command":"cmd_uninstall"}');
  addonsController.waitThenClick(uninstallExtensionButton);
 
  // Wait for the restart button
  var restartButton = new elementslib.XPath(addonsController.window.document, "/*[name()='window']/*[name()='notificationbox'][1]/*[name()='notification'][1]");
  addonsController.waitForElement(restartButton, gTimeout);
}

/**
 * Handle the Software Un-installation dialog
 */
var handleTriggerDialog = function(controller) 
{
  var cancelButton = new elementslib.Lookup(controller.window.document, '/id("addonList")/anon({"anonid":"buttons"})/{"dlgtype":"cancel"}');
  var uninstallButton = new elementslib.Lookup(controller.window.document, '/id("addonList")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');

  controller.waitForElement(cancelButton, gTimeout);

  controller.waitForEval("subject.disabled != true", 7000, 100, uninstallButton.getNode());
  controller.waitThenClick(uninstallButton, gTimeout);
}
