/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { expect } = require ("../../../lib/assertions");
var places = require("../../../lib/places");
var prefs = require("../../../lib/prefs");
var toolbars = require("../../../lib/toolbars");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = {
  url: LOCAL_TEST_FOLDER + 'layout/mozilla_grants.html',
  string: 'grants'
};

const PREF_LOCATION_BAR_SUGGEST = "browser.urlbar.default.behavior";

var setupModule = function() {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);

  places.removeAllHistory();

  // Location bar suggests "History and Bookmarks"
  prefs.preferences.setPref(PREF_LOCATION_BAR_SUGGEST, 0);
}

var teardownModule = function() {
  places.restoreDefaultBookmarks();
  locationBar.autoCompleteResults.close(true);
  prefs.preferences.clearUserPref(PREF_LOCATION_BAR_SUGGEST);
}

/**
 * Check a star appears in autocomplete list for a bookmarked page.
 */
var testStarInAutocomplete = function() {
  // Open the test page
  locationBar.loadURL(LOCAL_TEST_PAGE.url);
  controller.waitForPageLoad();

  // Bookmark the test page via bookmarks menu
  controller.mainMenu.click("#menu_bookmarkThisPage");

  // editBookmarksPanel is loaded lazily. Wait until overlay for StarUI has been loaded, then close the dialog
  controller.waitFor(function () {
    return controller.window.top.StarUI._overlayLoaded;
  }, "Edit This Bookmark doorhanger has been loaded");
  var doneButton = new elementslib.ID(controller.window.document, "editBookmarkPanelDoneButton");
  controller.click(doneButton);

  // We must open the blank page so the autocomplete result isn't "Swith to tab"
  controller.open("about:blank");
  controller.waitForPageLoad();

  // Clear history
  places.removeAllHistory();

  // Focus the locationbar, delete any contents there
  locationBar.clear();

  locationBar.type(LOCAL_TEST_PAGE.string);
  controller.waitFor(function () {
    return locationBar.value === LOCAL_TEST_PAGE.string;
  }, "Location bar contains the typed data - expected '" + LOCAL_TEST_PAGE.string + "'");

  // For the page title check matched text is underlined
  controller.waitFor(function () {
    return locationBar.autoCompleteResults.isOpened;
  }, "Autocomplete list has been opened");

  // Define the path to the first auto-complete result
  var richlistItem = locationBar.autoCompleteResults.getResult(0);

  var entries = locationBar.autoCompleteResults.getUnderlinedText(richlistItem, "title");
  entries.forEach(function (aEntry) {
    expect.equal(aEntry.toLowerCase(), LOCAL_TEST_PAGE.string,
                 "The page title matches the underlined text");
  });

  expect.contain(richlistItem.getNode().getAttribute("type"), "bookmark",
                 "The auto-complete result is a bookmark");

  locationBar.autoCompleteResults.close();
}

