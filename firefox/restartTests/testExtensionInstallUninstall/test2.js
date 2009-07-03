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
var MODULE_REQUIRES = ['UtilsAPI'];

// Shared variable
const gExtensionName = "Adblock Plus";

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testCheckInstalledExtension = function() {
  // Check if Add-ons Manager is opened after restart
  var window = mozmill.wm.getMostRecentWindow('Extension:Manager');
  var addonsController = new mozmill.controller.MozMillController(window);

  // Extensions pane should be selected
  var extensionsPane = new elementslib.ID(addonsController.window.document, "extensions-view");
  addonsController.waitForEval("subject.selected == true", 5000, 100, extensionsPane.getNode());

  // Notification bar should show one new installed extension
  var notificationBar = new elementslib.Lookup(addonsController.window.document, '/id("extensionsManager")/id("addonsMsg")/{"value":"1 new add-on has been installed.","image":"chrome://global/skin/icons/information-16.png","priority":"4","type":"warning"}/anon({"class":"notification-inner outset","flex":"1","xbl:inherits":"type","type":"warning"})/anon({"anonid":"details"})/anon({"anonid":"messageText"})');
  UtilsAPI.delayedAssertNode(addonsController, notificationBar, 5000);

  // The installed extension should be displayed with a different background in the list.
  // We can find it by the attribute "newAddon"
  // XXX: Use a hard-coded name to access the entry directly until we can pass the info
  // between restart test files (bug 500987)
  var extension = new elementslib.Lookup(addonsController.window.document, '/id("extensionsManager")/id("addonsMsg")/id("extensionsBox")/[1]/id("extensionsView")/anon({"newAddon":"true"})/anon({"flex":"1"})/{"class":"addonTextBox"}/anon({"anonid":"addonNameVersion"})/anon({"class":"addonName","crop":"end","xbl:inherits":"value=name","value":"' + gExtensionName + '"})');
  addonsController.assertNode(extension);
}
