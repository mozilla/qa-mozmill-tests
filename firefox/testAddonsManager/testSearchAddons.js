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
 * Testcase ID #6796 - Get Addons: Search for addons
 */

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrefsAPI'];

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  controller = mozmill.getAddonsController();
}

/**
 * Test the search for Add-ons
 */
var testSearchForAddons = function() 
{
  // Verify elements of the get addons pane are visible
  var getAddonsPane = new elementslib.ID(controller.window.document, "search-view");
  controller.waitThenClick(getAddonsPane, gTimeout);

  var searchField = new elementslib.ID(controller.window.document, "searchfield");
  controller.waitForElement(searchField, gTimeout);

  controller.type(searchField, "rss");
  controller.keypress(searchField, "VK_RETURN", {});

  // Wait for search results to populate and verify elements of search functionality
  var searchFieldButton = new elementslib.Lookup(controller.window.document, '/id("extensionsManager")/id("addonsMsg")/id("extensionsBox")/id("searchPanel")/id("searchfield")/anon({"class":"textbox-input-box"})/anon({"anonid":"search-icons"})');

  var footerField = new elementslib.ID(controller.window.document, "urn:mozilla:addons:search:status:footer");

  controller.waitForElement(footerField, 30000);  
  controller.assertProperty(footerField, "hidden", false);
  controller.assertJS(searchFieldButton.getNode().selectedPanel.getAttribute('class') == "textbox-search-clear");

  // Verify the number of addons is in-between 0 and the maxResults pref
  var maxResults = PrefsAPI.preferences.getPref("extensions.getAddons.maxResults", -1);
  var resultsPane = new elementslib.ID(controller.window.document, "extensionsView");

  controller.assertJS(resultsPane.getNode().itemCount > 0);
  controller.assertJS(resultsPane.getNode().itemCount <= maxResults );

  // Clear the search field and verify elements of that functionality
  controller.keypress(searchField, "VK_ESCAPE", {});
  controller.waitForElement(footerField, 30000);
  controller.assertProperty(footerField, "hidden", false);
  controller.assertJS(searchFieldButton.getNode().selectedPanel.getAttribute('class') != "textbox-search-clear");
  controller.assertValue(searchField, "");

  // Verify the number of recommended addons is in-between 0 and the maxResults pref
  controller.assertJS(resultsPane.getNode().itemCount > 0);
  controller.assertJS(resultsPane.getNode().itemCount <= maxResults );
}
