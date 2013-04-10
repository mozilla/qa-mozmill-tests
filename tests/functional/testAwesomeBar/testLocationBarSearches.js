/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { assert } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var toolbars = require("../../../lib/toolbars");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + "search/searchresults.html?q=";

const PREF_NAME = "keyword.URL";

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);

  prefs.preferences.setPref(PREF_NAME, LOCAL_TEST_PAGE);
}

var teardownModule = function() {
  prefs.preferences.clearUserPref(PREF_NAME);
}

/**
 * Check search in location bar for non-domain search terms (feeling lucky search)
 */
var testLocationBarSearches = function() {
  var testString = "Mozilla Firefox";

  controller.open("about:blank");
  controller.waitForPageLoad();

  locationBar.loadURL(testString);
  controller.waitForPageLoad();

  var searchTerm = new elementslib.ID(controller.tabs.activeTab, "term");
  assert.equal(searchTerm.getNode().textContent, testString,
               "Returned results contain the search term");
}

setupModule.__force_skip__ = "Bug 860330 - Test failure 'searchTerm.getNode(...) is null'";
teardownModule.__force_skip__ = "Bug 860330 - Test failure 'searchTerm.getNode(...) is null'";
