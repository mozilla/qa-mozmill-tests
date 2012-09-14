/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var places = require("../../../lib/places");
var prefs = require("../../../lib/prefs");
var toolbars = require("../../../lib/toolbars");

const PLACES_DB_TIMEOUT = 4000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  {URL: LOCAL_TEST_FOLDER + 'layout/mozilla_community.html',
   name: "community" }
];

const PREF_LOCATION_BAR_SUGGEST = "browser.urlbar.default.behavior";

var setupModule = function() {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);

  // Clear complete history so we don't get interference from previous entries
  places.removeAllHistory();

  // Location bar suggests "History and Bookmarks"
  prefs.preferences.setPref(PREF_LOCATION_BAR_SUGGEST, 0);
}

var teardownModule = function() {
  locationBar.autoCompleteResults.close(true);
  prefs.preferences.clearUserPref(PREF_LOCATION_BAR_SUGGEST);
}

/**
 * Check matched awesomebar items are highlighted.
 */
var testCheckItemHighlight = function() {
  // Open the test page then about:blank to set up the test test environment
  controller.open(LOCAL_TEST_PAGES[0].URL);
  controller.waitForPageLoad();
  controller.open("about:blank");
  controller.waitForPageLoad();

  // Wait for 4 seconds to work around Firefox LAZY ADD of items to the DB
  controller.sleep(PLACES_DB_TIMEOUT);

  // Focus the locationbar, delete any contents there, then type in a match string
  locationBar.clear();

  // Type the page name into the location bar
  locationBar.type(LOCAL_TEST_PAGES[0].name);

  // Wait for the location bar to contain the entire test string
  controller.waitFor(function () {
    return locationBar.value === LOCAL_TEST_PAGES[0].name;
  }, "Location bar contains the entered string - got '" +
    locationBar.value + "', expected '" + LOCAL_TEST_PAGES[0].name + "'");

  // Check the autocomplete list is open
  controller.waitFor(function () {
    return locationBar.autoCompleteResults.isOpened == true;
  }, "Autocomplete popup has been opened - got '" +
    locationBar.autoCompleteResults.isOpened + "', expected 'true'");

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
  controller.assert(function () {
    return underlined.length === 1;
  }, "Only one autocompleted result is underlined - got '" +
     underlined.length + "', expected '1'");

  // Check that the underlined URL matches the entered URL
  underlined.forEach(function (element) {
    controller.assert(function() {
      return element.toLowerCase() === LOCAL_TEST_PAGES[0].name;
    }, "Underlined " + aType + " matches entered " + aType + " - got '" +
       element.toLowerCase() + "', expected '" + LOCAL_TEST_PAGES[0].name +
       "'. Try again, got underlined string: " +
       locationBar.autoCompleteResults.
       getUnderlinedText(locationBar.autoCompleteResults.getResult(0), aType));
  });
}
