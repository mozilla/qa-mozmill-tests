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
 * Check history item appears in autocomplete list.
 */
var testSuggestHistoryAndBookmarks = function() {
  // Open the test page
  locationBar.loadURL(LOCAL_TEST_PAGE.url);
  controller.waitForPageLoad();

  // Wait for 4 seconds to work around Firefox LAZY ADD of items to the DB
  controller.sleep(4000);

  // Focus the locationbar, delete any contents there
  locationBar.clear();

  // Type in the test string
  locationBar.type(LOCAL_TEST_PAGE.string);

  // Get the visible results from the autocomplete list. Verify it is 1
  controller.waitFor(function () {
    return locationBar.autoCompleteResults.isOpened;
  }, "Autocomplete list has been opened");

  expect.equal(locationBar.autoCompleteResults.visibleResults.length, 1,
               "There is one visible result in the autocomplete list");

  // Define the path to the first auto-complete result
  var richlistItem = locationBar.autoCompleteResults.getResult(0);

  // For the page title check matched text is underlined
  var entries = locationBar.autoCompleteResults.getUnderlinedText(richlistItem, "title");
  for each (var entry in entries) {
    expect.equal(LOCAL_TEST_PAGE.string, entry.toLowerCase(),
                 "The page title matches the underlined text");
  }

  locationBar.autoCompleteResults.close();
}

