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
 * The Original Code is Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
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
 * Testcase ID #8154 - Launch Add-ons manager
 * Testcase ID #8155 - Get Add-ons Tab 
 */

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrefsAPI','UtilsAPI'];

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  
  UtilsAPI.closeAllTabs(controller);
}

/**
 * Test launching the addons manager
 */
var testLaunchAddonsManager = function()
{
  // Open the addons manager
  controller.click(new elementslib.Elem(controller.menus["tools-menu"].menu_openAddons));
  controller.sleep(500);

  var window = mozmill.wm.getMostRecentWindow('Extension:Manager');
  var addonsController = new mozmill.controller.MozMillController(window);  

  addonsController.sleep(500);

  // Verify elements of the addon manager are visible
  var panes = [
               {button: "search-view", label:"Get Add-ons"}, 
               {button: "extensions-view", label:"Extensions"},
               {button: "themes-view", label:"Themes"},
               {button: "plugins-view", label:"Plugins"}
              ];

  for each (pane in panes) 
  {
    var buttonCheck = new elementslib.ID(addonsController.window.document, pane.button);

    UtilsAPI.assertElementVisible(addonsController, buttonCheck, true);
    addonsController.assertProperty(buttonCheck, "label", pane.label);
  }

  // Verify the updates button is visible in the extensions pane
  var updatesButton = new elementslib.ID(addonsController.window.document, "checkUpdatesAllButton");
  UtilsAPI.assertElementVisible(addonsController, updatesButton, true);
}

/**
 * Test the functionality of the get addons tab
 */
var testGetAddonsTab = function()
{
  var addonsController = mozmill.getAddonsController();

  // Verify elements of the get addons pane are visible
  var getAddonsPane = new elementslib.ID(addonsController.window.document, "search-view");
  addonsController.waitThenClick(getAddonsPane, gTimeout);

  var searchField = new elementslib.ID(addonsController.window.document, "searchfield");
  addonsController.waitForElement(searchField, gTimeout);
  addonsController.assertProperty(searchField, "hidden", false);

  var browseAllAddons = new elementslib.ID(addonsController.window.document, "browseAddons");  
  addonsController.assertProperty(browseAllAddons, "hidden", false);

  // Verify recommended addons are shown within a nominal amount of time
  var footerField = new elementslib.ID(addonsController.window.document, "urn:mozilla:addons:search:status:footer");
  addonsController.waitForElement(footerField, 30000);
  addonsController.assertProperty(footerField, "hidden", false);

  // Verify the number of addons is in-between 0 and the maxResults pref
  var maxResults = PrefsAPI.preferences.getPref("extensions.getAddons.maxResults", -1);
  var recommendedAddonsPane = new elementslib.ID(addonsController.window.document, "extensionsView");

  addonsController.assertJS(recommendedAddonsPane.getNode().itemCount > 0);
  addonsController.assertJS(recommendedAddonsPane.getNode().itemCount <= maxResults );

  // Verify certain elements perform the proper action

  // Check if the see all recommended addons link is the same as the one in prefs
  var recommendedUrl = PrefsAPI.preferences.getPref("extensions.getAddons.recommended.browseURL", "");

  recommendedUrl = recommendedUrl.replace(/%LOCALE%/g, UtilsAPI.appInfo.locale);
  recommendedUrl = recommendedUrl.replace(/%APP%/g, UtilsAPI.appInfo.name.toLowerCase());

  addonsController.assertJS(footerField.getNode().getAttribute('link') == recommendedUrl);

  // Wait for the Browse All Add-ons link and click on it
  addonsController.waitThenClick(browseAllAddons, gTimeout);

  // The target web page is loaded lazily so wait for the newly created tab first
  controller.waitForEval("subject.tabs.length == 2", gTimeout, 100, controller);
  controller.waitForPageLoad();

  var browseAddonUrl = PrefsAPI.preferences.getPref("extensions.getAddons.browseAddons", "");

  browseAddonUrl = browseAddonUrl.replace(/%LOCALE%/g, UtilsAPI.appInfo.locale);
  browseAddonUrl = browseAddonUrl.replace(/%APP%/g, UtilsAPI.appInfo.name.toLowerCase());

  var locationBar = new elementslib.ID(controller.window.document, "urlbar");
  var pageUrl = locationBar.getNode().value;

  controller.assertJS(pageUrl.indexOf("addons.mozilla.org") != -1);
  controller.assertJS(pageUrl.indexOf(UtilsAPI.appInfo.locale) != -1);
  controller.assertJS(pageUrl.indexOf(UtilsAPI.appInfo.name.toLowerCase()) != -1);

  // Close the addons manager and wait a bit to make sure the focus is set to
  // the next window
  addonsController.keypress(recommendedAddonsPane, "VK_ESCAPE", {});
  addonsController.sleep(200);
}
