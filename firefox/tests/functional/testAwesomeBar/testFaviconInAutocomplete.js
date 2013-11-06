/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert, expect } = require("../../../../lib/assertions");
var places = require("../../../../lib/places");
var prefs = require("../../../lib/prefs");
var toolbars = require("../../../lib/toolbars");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = {
  url: BASE_URL + "layout/mozilla.html",
  string: "mozilla"
};

const PREF_LOCATION_BAR_SUGGEST = "browser.urlbar.default.behavior";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.locationBar =  new toolbars.locationBar(aModule.controller);

  // Clear complete history so we don't get interference from previous entries
  places.removeAllHistory();

  // Location bar suggests "History"
  prefs.preferences.setPref(PREF_LOCATION_BAR_SUGGEST, 1);
}

var teardownModule = function(aModule) {
  aModule.locationBar.autoCompleteResults.close(true);
  prefs.preferences.clearUserPref(PREF_LOCATION_BAR_SUGGEST);
}

/**
 * Check Favicon in autocomplete list
 *
 */
var testFaviconInAutoComplete = function() {
  // Open the local test page
  locationBar.loadURL(TEST_DATA.url);
  controller.waitForPageLoad();

  // Get the location bar Favicon element URL
  var locationBarFaviconUrl = locationBar.getElement({type:"favicon"}).getNode().getAttribute('src');

  // Wait for 4 seconds to work around Firefox LAZY ADD of items to the DB
  controller.sleep(4000);

  // Focus the locationbar, delete any contents there
  locationBar.clear();

  locationBar.type(TEST_DATA.string);
  assert.waitFor(function () {
    return locationBar.value === TEST_DATA.string;
  }, "Location bar contains the typed data - expected '" + TEST_DATA.string + "'");

  // Ensure the autocomplete list is open
  assert.waitFor(function () {
    return locationBar.autoCompleteResults.isOpened;
  }, "Autocomplete list has been opened");

  // Define the path to the first auto-complete result
  var richlistItem = locationBar.autoCompleteResults.getResult(0);

  // Get the URL for the autocomplete Favicon for the matched entry
  var listFaviconUrl = richlistItem.getNode().boxObject.firstChild.childNodes[0].getAttribute("src");

  expect.contain(richlistItem.getNode().image, locationBarFaviconUrl,
                 "Favicons in auto-complete list and location bar are identical");

  locationBar.autoCompleteResults.close();
}
