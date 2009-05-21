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
 *   Henrik Skupin <hskupin@gmail.com>
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

var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);
var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);

var gDelay = 0;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

/**
 *  Testcase ID #6200 - Open search by keyboard shortcuts
 */
var testSearchBarFocusAndSearch = function() {
  var os = mozmill.platform;
  var searchTerm = "Mozilla";

  var searchBar = new elementslib.ID(controller.window.document, 'searchbar');
  var locationBar = new elementslib.ID(controller.window.document, 'urlbar');

  // Focus the search bar and enter search term
  var key_K = 107;
  if (os == 'darwin') {
    controller.keypress(new elementslib.ID(controller.window.document, "main-window"), key_K, false, false, false, true);
  } else {
    controller.keypress(new elementslib.ID(controller.window.document, "main-window"), key_K, true, false, false, false);
  }

  controller.type(searchBar, searchTerm);
  controller.sleep(gDelay);

  // XXX: Pressing enter doesn't work right now due to a regression caused by
  //      bug 488315. So clicking the search icon for now.
  controller.click(new elementslib.Lookup(controller.window.document, '/id("main-window")/id("navigator-toolbox")/id("nav-bar")/id("search-container")/id("searchbar")/anon({"anonid":"searchbar-textbox"})/{"class":"search-go-container"}/anon({"anonid":"search-go-button"})'));
  controller.waitForPageLoad(controller.tabs.activeTab);

  // Retrieve the URL which is used for the currently selected search engine
  var bss = Components.classes["@mozilla.org/browser/search-service;1"].
                       getService(Components.interfaces.nsIBrowserSearchService);
  var targetURL = bss.currentEngine.getSubmission(searchTerm, null).uri;

  // Check if pure domain names are identical
  var domainName = targetURL.host.replace(/.+\.(\w+)\.\w+$/gi, "$1");
  if(locationBar.getNode().value.indexOf(domainName) == -1)
    throw "Expected domain name doesn't match the current one"

  // Check if search term is listed in URL
  if(locationBar.getNode().value.indexOf(searchTerm) == -1)
    throw "Search term in URL expected but not found.";

  // Clear search bar
  searchBar.getNode().value = "";
}
