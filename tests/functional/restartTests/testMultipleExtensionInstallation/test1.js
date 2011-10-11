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
 * The Initial Developer of the Original Code is
 * Tobias Markus <tobbi.bugs@googlemail.com>.
 *
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aaron Train <atrain@mozilla.com>
 *   Alex Lakatos <alex.lakatos@softvision.ro>
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

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../../data/');

const TIMEOUT = 5000;
const TIMEOUT_INSTALL_DIALOG = 30000;
const TIMEOUT_INSTALLATION = 30000;

// Object of all add-ons we want to install
const gAddons = [
  {name: "Test Extension (icons)",
   id: "test-icons@quality.mozilla.org",
   url: LOCAL_TEST_FOLDER + "/addons/install.html?addon=/extensions/icons.xpi"},
  {name: "Test Extension (empty)",
   id: "test-empty@quality.mozilla.org",
   url: LOCAL_TEST_FOLDER + "/addons/install.html?addon=/extensions/empty.xpi"}
];

var setupModule = function() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.addonsManager();

  // Whitelist add the localhost
  addons.addToWhiteList(LOCAL_TEST_FOLDER);

  // Store the addons object in 'persisted.addons'
  persisted.addons = gAddons;
}

var testInstallExtensions = function() {
  for each(addon in persisted.addons) {
    controller.open(addon.url);
    controller.waitForPageLoad();

    // Create a modal dialog instance to handle the Software Installation dialog
    var md = new modalDialog.modalDialog(controller.window);
    md.start(handleTriggerDialog);

    // Click the link to install the extension
    var installLink = new elementslib.ID(controller.tabs.activeTab, "addon");
    controller.click(installLink);
    md.waitForDialog(TIMEOUT_INSTALL_DIALOG);

    // Wait that the Installation pane is selected after the extension has been installed
    addonsManager.waitForOpened(controller);
    addonsManager.controller.waitForEval("subject.manager.paneId == 'installs'", TIMEOUT, 100,
                                         {manager: addonsManager});

    // Check if the installed extension is visible in the Add-ons Manager
    var extension = addonsManager.getListboxItem("addonID", addon.id);
    addonsManager.controller.waitForElement(extension, TIMEOUT_INSTALLATION);

    var matchNames = (extension.getNode().getAttribute('name') == addon.name);
    addonsManager.controller.assertJS("subject.isValidExtensionName == true",
                                      {isValidExtensionName: matchNames});

    // Check if restart button is present
    var restartButton = addonsManager.getElement({type: "notificationBar_buttonRestart"});
    addonsManager.controller.waitForElement(restartButton, TIMEOUT);
  }
}

/**
 * Handle the Software Installation dialog
 * @param {MozmillController} controller
 *        MozMillController of the window to operate on
 */
var handleTriggerDialog = function(controller) {
  // Get list of extensions which should be installed
  var list = new elementslib.ID(controller.window.document, "itemList");
  controller.waitForElement(list, TIMEOUT);

  // There should be listed only one extension
  controller.assertJS("subject.extensions.length == 1",
                      {extensions: list.getNode().childNodes});

  // Check if the extension name is shown
  // XXX: Foo must be used here because it is given by the install.html
  controller.assertJS("subject.extensions[0].name == subject.extensionName",
                      {extensions: list.getNode().childNodes,
                       extensionName: "Foo"});

  // Check if the Cancel button is present
  var cancelButton = new elementslib.Lookup(controller.window.document,
                                            '/id("xpinstallConfirm")/anon({"anonid":"buttons"})/{"dlgtype":"cancel"}');
  controller.assertNode(cancelButton);

  // Wait for the install button is enabled before clicking on it
  var installButton = new elementslib.Lookup(controller.window.document,
                                             '/id("xpinstallConfirm")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  controller.waitForEval("subject.disabled != true", 7000, 100,
                         installButton.getNode());
  controller.click(installButton);
}
