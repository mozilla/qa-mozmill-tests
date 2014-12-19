/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var places = require("../../../../lib/places");
var prefs = require("../../../../lib/prefs");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = [
  BASE_URL + "layout/mozilla.html",
  BASE_URL + "layout/mozilla_community.html",
  BASE_URL + "layout/mozilla_contribute.html",
  BASE_URL + "layout/mozilla_governance.html",
  BASE_URL + "layout/mozilla_grants.html",
  BASE_URL + "layout/mozilla_mission.html",
  BASE_URL + "layout/mozilla_organizations.html",
  BASE_URL + "layout/mozilla_projects.html"
];

const PREF_LOCATION_BAR_SUGGEST = "browser.urlbar.default.behavior";

var setupModule = function(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  // Clear complete history so we don't get interference from previous entries
  places.removeAllHistory();

  // Ensure Location bar suggests "History and Bookmarks"
  prefs.setPref(PREF_LOCATION_BAR_SUGGEST, 0);
}

var teardownModule = function(aModule) {
  aModule.locationBar.autoCompleteResults.close(true);
  prefs.clearUserPref(PREF_LOCATION_BAR_SUGGEST);
}

/**
 * Check the maximum visible items in a match list.
 */
var testVisibleItemsMax = function() {
  // History visit listener
  places.waitForVisited(TEST_DATA, () => {
    // Open some local pages to set up the test environment
    TEST_DATA.forEach(function (aPage) {
      locationBar.loadURL(aPage);
      controller.waitForPageLoad();
    });
  });

  var testString = 'll';

  // Focus the locationbar, delete any contents there
  locationBar.clear();

  locationBar.type(testString);
  assert.waitFor(function () {
    return locationBar.value === testString;
  }, "Location bar contains the typed data - expected '" + testString + "'");

  // Get the visible results from the autocomplete list. Verify it is equal to maxrows
  var popup = locationBar.autoCompleteResults.getElement({type:"popup"});
  var autoCompleteResultsList = locationBar.autoCompleteResults.getElement({type:"results"});
  var maxRows = locationBar.urlbar.getNode().getAttribute("maxrows");

  // Bug 901946
  // Because the height is not computed dynamically but is row1 height * maxrows
  // getNumberOfVisibleRows() returns a different number than max for certain
  // exotic locales. Use the same algorithm here.
  assert.waitFor(() => (parseInt(autoCompleteResultsList.getNode().height) ===
                        parseInt(maxRows * popup.getNode()._rowHeight)),
                 "Number of visible rows should equal " + maxRows);

  locationBar.autoCompleteResults.close();
}
