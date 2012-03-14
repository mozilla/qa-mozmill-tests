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
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Anthony Hughes <ashughes@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
 *   Remus Pop <remus.pop@softvision.ro>
 *   Vlad Maniac <vmaniac@mozilla.com>
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
var prefs = require("../../../lib/prefs");
var search = require("../../../lib/search");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");


const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla_mission.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();

  searchBar = new search.searchBar(controller);
  tabs = new tabs.tabBrowser(controller);
  tabs.closeAllTabs();
}

var teardownModule = function() {
  searchBar.clear();
  searchBar.restoreDefaultEngines();

  prefs.preferences.clearUserPref("browser.tabs.loadInBackground");
}

/**
 * Use a search engine to search for the currently selected text.
 */
var testSearchSelectionViaContextMenu = function() {
  var engines = searchBar.visibleEngines;
  var engineName = engines[engines.length - 1].name;

  // Use the last engine for the search
  searchBar.selectedEngine = engineName;

  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  // Get text element from web page, which will be used for the search
  var textElem = new elementslib.ID(controller.tabs.activeTab, "goal");

  // Start search which opens a new tab in the background
  startSearch(textElem, engineName, true);

  // Start search which opens a new tab in the foreground
  startSearch(textElem, engineName, false);
}

/**
 * Start the search via the context menu of selected text
 *
 * @param {ElemBase} element
 *        Element to select and search for
 * @param {string} engineName
 *        Name of the engine to use
 * @param {boolean} loadInBackground
 *        Whether the search results should open in a forground or background tab
 */
var startSearch = function(element, engineName, loadInBackground) {
  var tabCount = tabs.length;
  var tabIndex = tabs.selectedIndex;

  prefs.preferences.setPref("browser.tabs.loadInBackground", loadInBackground);

  // Select a word and remember the selection
  controller.doubleClick(element, 5, 5);
  var selection = controller.tabs.activeTabWindow.getSelection().toString().trim();

  // Use the context menu to start a search
  controller.rightClick(element);

  var contextEntry = new elementslib.ID(controller.window.document, "context-searchselect");
  controller.waitForElement(contextEntry);

  var contextLabel = contextEntry.getNode().getAttribute('label');

  controller.assertJS("subject.isEngineNameInContextMenu == true",
                      {isEngineNameInContextMenu: contextLabel.indexOf(engineName) != -1});
  controller.click(contextEntry);
  utils.closeContentAreaContextMenu(controller);

  // A new tab will be opened in the background
  controller.waitFor(function () {
    return tabs.length === (tabCount + 1);
  }, "A new tab has been opened");

  if (loadInBackground) {
    controller.waitFor(function () {
      return tabs.selectedIndex === tabIndex;
    }, "A new tab has been opened in the background");
    tabs.selectedIndex = tabs.selectedIndex + 1;
  } else {
    controller.waitFor(function () {
      return tabs.selectedIndex === tabIndex + 1;
    }, "A new tab has been opened in the foreground");
  }

  controller.waitForPageLoad();

  // Check the loaded page
  searchBar.checkSearchResultPage(selection);

  tabs.closeTab("shortcut");
  tabs.selectedIndex = tabIndex;
}
