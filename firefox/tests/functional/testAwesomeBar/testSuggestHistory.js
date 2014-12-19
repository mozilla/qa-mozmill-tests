/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert, expect } = require("../../../../lib/assertions");
var places = require("../../../../lib/places");
var prefs = require("../../../../lib/prefs");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = {
  url: BASE_URL + "layout/mozilla_grants.html",
  string: "grants"
};

const PREF_LOCATION_BAR_SUGGEST = "browser.urlbar.default.behavior";

var setupModule = function(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  places.removeAllHistory();

  // Location bar suggests "History and Bookmarks"
  prefs.setPref(PREF_LOCATION_BAR_SUGGEST, 0);
}

var teardownModule = function(aModule) {
  places.restoreDefaultBookmarks();
  aModule.locationBar.autoCompleteResults.close(true);
  prefs.clearUserPref(PREF_LOCATION_BAR_SUGGEST);
}

/**
 * Check history item appears in autocomplete list.
 */
var testSuggestHistoryAndBookmarks = function() {
  // History visit listener
  places.waitForVisited(TEST_DATA.url, () => {
    // Open the test page
    locationBar.loadURL(TEST_DATA.url);
    controller.waitForPageLoad();
  });

  // Focus the locationbar, delete any contents there
  locationBar.clear();

  locationBar.type(TEST_DATA.string);
  assert.waitFor(function () {
    return locationBar.value === TEST_DATA.string;
  }, "Location bar contains the typed data - expected '" + TEST_DATA.string + "'");

  assert.waitFor(function () {
    return locationBar.autoCompleteResults.isOpened;
  }, "Autocomplete list has been opened");

  expect.waitFor(() => (locationBar.autoCompleteResults.visibleResults.length === 1),
                 "Expected to be one visible result in the autocomplete list");

  // Define the path to the first auto-complete result
  var richlistItem = locationBar.autoCompleteResults.getResult(0);

  // For the page title check matched text is underlined
  var underlined = locationBar.autoCompleteResults.
                   getUnderlinedText(richlistItem, "title");
  underlined.forEach(function (aElement, aIndex) {
    expect.waitFor(function () {
      aElement = locationBar.autoCompleteResults.
                 getUnderlinedText(richlistItem, "title")[aIndex];
      return aElement.toString().toLowerCase() === TEST_DATA.string;
    }, "The page title matches the underlined text");
  });

  locationBar.autoCompleteResults.close();
}
