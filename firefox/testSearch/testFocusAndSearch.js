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

/**
 * Litmus test #6199: Use mouse to focus search bar and start a search
 * Litmus test #6200: Open search by keyboard shortcuts
 */

const gDelay = 0;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();

  locationBar = new elementslib.ID(controller.window.document, 'urlbar');
  searchBar = new elementslib.ID(controller.window.document, 'searchbar');
}

var testSearchBarFocusAndSearch = function() {
  // The engine button overlays the textbox so click 1px behind the button
  var engineButton = new elementslib.Lookup(controller.window.document, '/id("main-window")/id("navigator-toolbox")/id("nav-bar")/id("search-container")/id("searchbar")/anon({"anonid":"searchbar-textbox"})/anon({"anonid":"searchbar-engine-button"})');
  controller.click(searchBar, engineButton.getNode().clientWidth + 10, 1);
  doSearch("Firefox");

  // Use shortcut to start search
  controller.keypress(null, 'k', {accelKey: true});
  doSearch("Mozilla");

  // Focus search bar, clear content and start an empty search
  controller.keypress(null, 'k', {accelKey: true});
  controller.keypress(searchBar, 'VK_DELETE', {});
  controller.keypress(searchBar, 'VK_RETURN', {});
}

/**
 * Start a search with the given search term and checks if the resulting URL
 * contains the search term.
 *
 * @param searchTerm string Text you are searching for
 */
var doSearch = function(searchTerm) {
  // Enter search term in text field
  controller.type(searchBar, searchTerm);

  // Start the search by pressing return
  controller.keypress(searchBar, 'VK_RETURN', {});
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
}
