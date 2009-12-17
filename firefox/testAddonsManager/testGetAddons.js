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

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['AddonsAPI', 'PrefsAPI','UtilsAPI'];

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  module.controller = mozmill.getBrowserController();
  module.addonsManager = new AddonsAPI.addonsManager();

  UtilsAPI.closeAllTabs(controller);
}

var teardownModule = function(module)
{
  module.addonsManager.close();
}

/**
 * Test launching the addons manager
 */
var testLaunchAddonsManager = function()
{
  // Open the addons manager via the menu entry
  addonsManager.open(controller);

  // Verify that panes are visible and can be selected
  for each (pane in ["search", "extensions", "themes", "plugins"]) {
    addonsManager.setPane(pane);

    // Verify the update button is visible for extensions and themes
    if (pane == "extensions" || pane == "themes") {
      var updatesButton = new elementslib.ID(addonsManager.controller.window.document,
                                             "checkUpdatesAllButton");
      UtilsAPI.assertElementVisible(addonsManager.controller, updatesButton, true);
    }
  }
}

/**
 * Test the functionality of the get addons tab
 */
var testGetAddonsTab = function()
{
  var addonsController = addonsManager.controller;

  // Verify elements of the get addons pane are visible
  addonsManager.setPane("search");

  var searchField = new elementslib.ID(addonsController.window.document, "searchfield");
  addonsController.waitForEval("subject.hidden == false", gTimeout, 100, searchField.getNode());

  var browseAllAddons = new elementslib.ID(addonsController.window.document, "browseAddons");
  addonsController.waitForEval("subject.hidden == false", gTimeout, 100, browseAllAddons.getNode());

  var footerField = new elementslib.ID(addonsController.window.document, "urn:mozilla:addons:search:status:footer");
  addonsController.waitForElement(footerField, 30000);
  addonsController.assertProperty(footerField, "hidden", false);

  // Verify the number of addons is in-between 0 and the maxResults pref
  var maxResults = PrefsAPI.preferences.getPref("extensions.getAddons.maxResults", -1);
  var listBox = new elementslib.ID(addonsController.window.document, "extensionsView");

  addonsController.assertJS("subject.itemCount > 0", listBox.getNode());
  addonsController.assertJS("subject.itemCount <= " + maxResults, listBox.getNode());

  // Verify certain elements perform the proper action

  // Check if the see all recommended addons link is the same as the one in prefs
  // XXX: Bug 529412 - Mozmill cannot operate on XUL elements which are outside of the view
  // So we can only compare the URLs for now.
  var recommendedUrl = PrefsAPI.preferences.getPref("extensions.getAddons.recommended.browseURL", "");
  recommendedUrl = recommendedUrl.replace(/%LOCALE%/g, UtilsAPI.appInfo.locale);
  recommendedUrl = recommendedUrl.replace(/%APP%/g, UtilsAPI.appInfo.name.toLowerCase());

  addonsController.assertJS("subject.getAttribute('link') == '" + recommendedUrl + "'",
                            footerField.getNode());

  // Check if the browse all addons link is the same as the one in prefs
  var browseAddonUrl = PrefsAPI.preferences.getPref("extensions.getAddons.browseAddons", "");
  browseAddonUrl = browseAddonUrl.replace(/%LOCALE%/g, UtilsAPI.appInfo.locale);
  browseAddonUrl = browseAddonUrl.replace(/%APP%/g, UtilsAPI.appInfo.name.toLowerCase());

  // Wait for the Browse All Add-ons link and click on it
  addonsController.waitThenClick(browseAllAddons, gTimeout);

  // The target web page is loaded lazily so wait for the newly created tab first
  controller.waitForEval("subject.tabs.length == 2", gTimeout, 100, controller);
  controller.waitForPageLoad();
  UtilsAPI.assertLoadedUrlEqual(controller, browseAddonUrl);
}

/**
 * Map test functions to litmus tests
 */
testLaunchAddonsManager.meta = {litmusids : [8154]};
testGetAddonsTab.meta = {litmusids : [8155]};
