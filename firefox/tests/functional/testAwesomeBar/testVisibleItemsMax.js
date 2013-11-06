/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var places = require("../../../../lib/places");
var prefs = require("../../../lib/prefs");
var toolbars = require("../../../lib/toolbars");

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
  aModule.controller = mozmill.getBrowserController();
  aModule.locationBar =  new toolbars.locationBar(aModule.controller);

  // Clear complete history so we don't get interference from previous entries
  places.removeAllHistory();

  // Ensure Location bar suggests "History and Bookmarks"
  prefs.preferences.setPref(PREF_LOCATION_BAR_SUGGEST, 0);
}

var teardownModule = function(aModule) {
  aModule.locationBar.autoCompleteResults.close(true);
  prefs.preferences.clearUserPref(PREF_LOCATION_BAR_SUGGEST);
}

/**
 * Check the maximum visible items in a match list.
 */
var testVisibleItemsMax = function() {
  // Open some local pages to set up the test environment
  TEST_DATA.forEach(function (aPage) {
    locationBar.loadURL(aPage);
    controller.waitForPageLoad();
  });

  // Wait for 4 seconds to work around Firefox LAZY ADD of items to the DB
  controller.sleep(4000);

  var testString = 'll';

  // Focus the locationbar, delete any contents there
  locationBar.clear();

  locationBar.type(testString);
  assert.waitFor(function () {
    return locationBar.value === testString;
  }, "Location bar contains the typed data - expected '" + testString + "'");

  // Get the visible results from the autocomplete list. Verify it is equal to maxrows
  var autoCompleteResultsList = locationBar.autoCompleteResults.getElement({type:"results"});
  var maxRows = locationBar.urlbar.getNode().getAttribute("maxrows");
  assert.waitFor(function () {
    return autoCompleteResultsList.getNode().getNumberOfVisibleRows() === parseInt(maxRows);
  }, "Number of visible rows should equal " + maxRows);

  locationBar.autoCompleteResults.close();
}
