/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {expect} = require("../../../lib/assertions");
var places = require("../../../lib/places");
var prefs = require("../../../lib/prefs");
var toolbars = require("../../../lib/toolbars");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_PAGES = [
  LOCAL_TEST_FOLDER + 'layout/mozilla.html', 
  LOCAL_TEST_FOLDER + 'layout/mozilla_community.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_contribute.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_governance.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_grants.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_mission.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_organizations.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_projects.html',
];

const PREF_LOCATION_BAR_SUGGEST = "browser.urlbar.default.behavior";

var setupModule = function() {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);

  // Clear complete history so we don't get interference from previous entries
  places.removeAllHistory();

  // Ensure Location bar suggests "History and Bookmarks"
  prefs.preferences.setPref(PREF_LOCATION_BAR_SUGGEST, 0);
}

var teardownModule = function() {
  locationBar.autoCompleteResults.close(true);
  prefs.preferences.clearUserPref(PREF_LOCATION_BAR_SUGGEST);
}

/**
 * Check the maximum visible items in a match list.
 */
var testVisibleItemsMax = function() {
  // Open some local pages to set up the test environment
  for each (var page in LOCAL_PAGES) {
    locationBar.loadURL(page);
    controller.waitForPageLoad();
  }

  // Wait for 4 seconds to work around Firefox LAZY ADD of items to the DB
  controller.sleep(4000);

  var testString = 'll';

  // Focus the locationbar, delete any contents there
  locationBar.clear();

  // Use type and sleep on each letter to allow the autocomplete to populate with results.
  for each (var letter in testString) {
    locationBar.type(letter);
    controller.sleep(100);
  }

  var autoCompleteResultsList = locationBar.autoCompleteResults.getElement({type:"results"});
  controller.waitFor(function() {
    return locationBar.autoCompleteResults.isOpened;
  }, "Autocomplete list has been opened");

  // Get the visible results from the autocomplete list. Verify it is equal to maxrows
  var visibleRows = autoCompleteResultsList.getNode().getNumberOfVisibleRows();
  var maxRows = locationBar.urlbar.getNode().getAttribute("maxrows");
  expect.equal(visibleRows, parseInt(maxRows),
               "Number of visible rows should equal max rows");

  locationBar.autoCompleteResults.close();
}

