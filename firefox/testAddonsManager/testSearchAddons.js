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
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['AddonsAPI', 'PrefsAPI'];

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  module.addonsManager = new AddonsAPI.addonsManager();
}

var teardownModule = function(module)
{
  module.addonsManager.close();
}

/**
 * Test the search for Add-ons
 */
var testSearchForAddons = function() 
{
  addonsManager.open();
  controller = addonsManager.controller;

  // Verify elements of the get addons pane are visible
  addonsManager.search("rss");

  // Wait for search results to populate and verify elements of search functionality
  var footerField = new elementslib.ID(controller.window.document, "urn:mozilla:addons:search:status:footer");

  controller.waitForElement(footerField, 30000);  
  controller.assertProperty(footerField, "hidden", false);
  controller.assertJS("subject.selectedPanel.getAttribute('class') == 'textbox-search-clear'",
                      addonsManager.searchFieldButton.getNode());

  // Verify the number of addons is in-between 0 and the maxResults pref
  var maxResults = PrefsAPI.preferences.getPref("extensions.getAddons.maxResults", -1);
  var listBox = new elementslib.ID(controller.window.document, "extensionsView");

  controller.assertJS("subject.itemCount > 0", listBox.getNode());
  controller.assertJS("subject.itemCount <= " + maxResults, listBox.getNode());

  // Clear the search field and verify elements of that functionality
  controller.keypress(addonsManager.searchField, "VK_ESCAPE", {});
  controller.waitForElement(footerField, 30000);
  controller.assertProperty(footerField, "hidden", false);
  controller.assertJS("subject.selectedPanel.getAttribute('class') != 'textbox-search-clear'",
                      addonsManager.searchFieldButton.getNode());
  controller.assertValue(addonsManager.searchField, "");

  // Verify the number of recommended addons is in-between 0 and the maxResults pref
  controller.assertJS("subject.itemCount > 0", listBox.getNode());
  controller.assertJS("subject.itemCount <= " + maxResults, listBox.getNode());
}

/**
 * Map test functions to litmus tests
 */
testSearchForAddons.meta = {litmusids : [6796]};
