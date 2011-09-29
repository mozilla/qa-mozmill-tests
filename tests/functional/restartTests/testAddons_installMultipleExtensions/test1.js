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

const LOCAL_INSTALL_FILE = "install.html?addon="
const LOCAL_TEST_FOLDER = collector.addHttpResource("../../../../data/addons/");

const ADDONS = [
  {id: "test-empty@quality.mozilla.org",
   url: LOCAL_TEST_FOLDER + LOCAL_INSTALL_FILE + "extensions/empty.xpi"},
  {id: "test-icons@quality.mozilla.org",
   url: LOCAL_TEST_FOLDER + LOCAL_INSTALL_FILE + "extensions/icons.xpi"}
];


function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  // Whitelist add localhost
  addons.addToWhiteList(LOCAL_TEST_FOLDER);

  // Store the addons object in 'persisted.addons'
  persisted.addons = ADDONS;

  tabs.closeAllTabs(controller);
}

/**
 * Installs multiple addons
 */
function testInstallMultipleExtensions() {
  persisted.addons.forEach(function(addon) {
    // Open the addon page
    controller.open(addon.url);
    controller.waitForPageLoad();
    
    var installLink = new elementslib.ID(controller.tabs.activeTab, "addon");
    var md = new modalDialog.modalDialog(addonsManager.controller.window);
    
    // Install the addon
    md.start(addons.handleInstallAddonDialog);
    controller.click(installLink);
    md.waitForDialog();
    controller.keypress(null , 'VK_ESCAPE', {});
  });
}

