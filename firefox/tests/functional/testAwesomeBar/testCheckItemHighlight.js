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
  name: "grants"
};

const PREF_LOCATION_BAR_SUGGEST = "browser.urlbar.default.behavior";

var setupModule = function(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  // Clear complete history so we don't get interference from previous entries
  places.removeAllHistory();

  // Location bar suggests "History and Bookmarks"
  prefs.setPref(PREF_LOCATION_BAR_SUGGEST, 0);
}

var teardownModule = function(aModule) {
  aModule.locationBar.autoCompleteResults.close(true);
  prefs.clearUserPref(PREF_LOCATION_BAR_SUGGEST);
}

/**
 * Check matched awesomebar items are highlighted.
 */
var testCheckItemHighlight = function() {
  // History visit listener
  places.waitForVisited(TEST_DATA.url, () => {
    // Open the test page then about:blank to set up the test test environment
    controller.open(TEST_DATA.url);
    controller.waitForPageLoad();
    controller.open("about:blank");
    controller.waitForPageLoad();
  });

  // Focus the locationbar, delete any contents there, then type in a match string
  locationBar.clear();

  // Type the page name into the location bar
  locationBar.type(TEST_DATA.name);

  // Wait for the location bar to contain the entire test string
  assert.waitFor(function () {
    return locationBar.value === TEST_DATA.name;
  }, "Location bar contains the entered string - expected '" + TEST_DATA.name + "'");

  // Check the autocomplete list is open
  assert.waitFor(function () {
    return locationBar.autoCompleteResults.isOpened == true;
  }, "Autocomplete popup has been opened - expected 'true'");

  // Wait for the autocomplete to be populated
  assert.waitFor(() => (locationBar.autoCompleteResults.visibleResults.length === 1),
                 "Expected to be one visible result in the autocomplete list");

  // Result to check for underlined text
  var richlistItem = locationBar.autoCompleteResults.getResult(0);

  checkAwesomebarResults(richlistItem, "title");
  checkAwesomebarResults(richlistItem, "url");

  locationBar.autoCompleteResults.close();
}

/**
 * Check the awesomebar results against what was typed
 *
 * @param {object} aResult
 *        A matching entry from the awesomebar
 * @param {string} aType
 *        The type of result
 */
function checkAwesomebarResults(aResult, aType) {
  // Get a list of any underlined autocomplete results
  var underlined = locationBar.autoCompleteResults.
                   getUnderlinedText(aResult, aType);

  // Check that there is only 1 entry
  assert.equal(underlined.length, 1,
               "Only one autocompleted result is underlined");

  // Check that the underlined URL matches the entered URL
  underlined.forEach(function (aElement, aIndex) {
    expect.waitFor(function () {
      aElement = locationBar.autoCompleteResults.
                 getUnderlinedText(aResult, aType)[aIndex];
      return aElement.toString().toLowerCase() === TEST_DATA.name;
    }, "The page " + aType + " matches the underlined text");
  });
}
