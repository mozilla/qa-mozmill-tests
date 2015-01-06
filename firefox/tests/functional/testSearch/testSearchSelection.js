/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var search = require("../../../lib/search");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla_mission.html";

const PREF_LOAD_IN_BACKGROUND = "browser.search.context.loadInBackground";

const SEARCH_ENGINE = {
  name : "mozqa.com",
  url : BASE_URL + "search/mozsearch.html"
};

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.engineManager = new search.engineManager(aModule.controller);
  aModule.searchBar = new search.searchBar(aModule.controller);
  aModule.tabs = new tabs.tabBrowser(aModule.controller);

  aModule.tabs.closeAllTabs();
}

var teardownModule = function(aModule) {
  aModule.searchBar.clear();
  aModule.searchBar.restoreDefaultEngines();

  prefs.clearUserPref(PREF_LOAD_IN_BACKGROUND);
}

/**
 * Use a search engine to search for the currently selected text.
 */
var testSearchSelectionViaContextMenu = function() {
  engineManager.installFromUrl(SEARCH_ENGINE.name, SEARCH_ENGINE.url, function () {
    var addButton = new elementslib.Name(controller.tabs.activeTab, "add");
    controller.click(addButton);
  });

  // Use the last engine for the search
  searchBar.selectedEngine = SEARCH_ENGINE.name;

  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get text element from web page, which will be used for the search
  var textElem = new elementslib.ID(controller.tabs.activeTab, "goal");

  // Start search which opens a new tab in the background
  startSearch(textElem, SEARCH_ENGINE.name, true);

  // Start search which opens a new tab in the foreground
  startSearch(textElem, SEARCH_ENGINE.name, false);
}

/**
 * Start the search via the context menu of selected text
 *
 * @param {ElemBase} aElement
 *        Element to select and search for
 * @param {string} aEngineName
 *        Name of the engine to use
 * @param {boolean} aLoadInBackground
 *        Whether the search results should open in a forground or background tab
 */
var startSearch = function(aElement, aEngineName, aLoadInBackground) {
  var tabCount = tabs.length;
  var tabIndex = tabs.selectedIndex;

  prefs.setPref(PREF_LOAD_IN_BACKGROUND, aLoadInBackground);

  // Select a word and remember the selection
  controller.doubleClick(aElement, 5, 5);
  var selection = controller.tabs.activeTabWindow.getSelection().toString().trim();

  // Use the context menu to start a search
  controller.rightClick(aElement);

  var contextEntry = new elementslib.ID(controller.window.document, "context-searchselect");
  controller.waitForElement(contextEntry);

  var contextLabel = contextEntry.getNode().getAttribute('label');

  expect.contain(contextLabel, aEngineName, "The specified search engine is installed");

  tabs.openTab({method: "callback", callback: () => {
    controller.click(contextEntry);
    utils.closeContentAreaContextMenu(controller);
  }});

  // A new tab will be opened in the background
  assert.waitFor(function () {
    return tabs.length === (tabCount + 1);
  }, "A new tab has been opened");

  if (aLoadInBackground) {
    assert.waitFor(function () {
      return tabs.selectedIndex === tabIndex;
    }, "A new tab has been opened in the background");
    tabs.selectedIndex = tabs.selectedIndex + 1;
  }
  else {
    assert.waitFor(function () {
      return tabs.selectedIndex === tabIndex + 1;
    }, "A new tab has been opened in the foreground");
  }

  controller.waitForPageLoad();

  // Check the loaded page
  searchBar.checkSearchResultPage(selection);

  tabs.closeTab({method: "shortcut"});
  tabs.selectedIndex = tabIndex;
}
