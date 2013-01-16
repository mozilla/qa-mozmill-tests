/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { assert, expect } = require("../../../lib/assertions");
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

  expect.contain(contextLabel, engineName, "The specified search engine is installed");

  controller.click(contextEntry);
  utils.closeContentAreaContextMenu(controller);

  // A new tab will be opened in the background
  assert.waitFor(function () {
    return tabs.length === (tabCount + 1);
  }, "A new tab has been opened");

  if (loadInBackground) {
    assert.waitFor(function () {
      return tabs.selectedIndex === tabIndex;
    }, "A new tab has been opened in the background");
    tabs.selectedIndex = tabs.selectedIndex + 1;
  } else {
    assert.waitFor(function () {
      return tabs.selectedIndex === tabIndex + 1;
    }, "A new tab has been opened in the foreground");
  }

  controller.waitForPageLoad();

  // Check the loaded page
  searchBar.checkSearchResultPage(selection);

  tabs.closeTab("shortcut");
  tabs.selectedIndex = tabIndex;
}

/**
 * Bug 701903 - Failure in testSearchSelection.js: Timeout exceed for
 *             'subject.selectedTabIndex == subject.expectedIndex'
 */
setupModule.__force_skip__ = "Bug 701903 - Failure in testSearchSelection.js: " +
                             "Timeout exceed for subject.selectedTabIndex == subject.expectedIndex";
teardownModule.__force_skip__ = "Bug 701903 - Failure in testSearchSelection.js: " +
                                "Timeout exceed for subject.selectedTabIndex == subject.expectedIndex";
