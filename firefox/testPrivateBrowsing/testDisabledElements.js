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

// Include the required modules
var privateBrowsing = require("../../shared-modules/private-browsing");
var tabs = require("../../shared-modules/tabs");
var utils = require("../../shared-modules/utils");

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);

  // Create Private Browsing instance and set handler
  pb = new privateBrowsing.privateBrowsing(controller);
}

var teardownModule = function(module) {
  pb.reset();
}

/**
 * Verify "Import" is disabled during Private Browsing mode
 */
var testCheckImportDisabled = function() {
  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  pb.start();

  // File -> Import should be disabled
  var importItem = new elementslib.ID(controller.window.document, "menu_import");
  controller.assertJSProperty(importItem, "disabled", true);

  // On Mac we also have to check the menu item when the Library is open
  if (mozmill.isMac) {
    var libraryItem = new elementslib.ID(controller.window.document, "bookmarksShowAll");
    controller.click(libraryItem);

    utils.handleWindow("type", "Places:Organizer", checkImportMenu);
  }
}

/**
 * Check that the import menuitem is disabled
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function checkImportMenu(controller) {
  // Check File -> Import entry again
  var importItem = new elementslib.ID(controller.window.document, "menu_import");
  controller.assertJSProperty(importItem, "disabled", true);

  // Check that "Import HTML" is available
  var importHTML = new elementslib.ID(controller.window.document, "fileImport");
  controller.assertNotJSProperty(importHTML, "disabled");

  var cmdKey = utils.getEntity(tabBrowser.getDtds(), "closeCmd.key");
  controller.keypress(null, cmdKey, {accelKey: true});
}

/**
 * Map test functions to litmus tests
 */
// testCheckImportDisabled.meta = {litmusids : [7541]};
