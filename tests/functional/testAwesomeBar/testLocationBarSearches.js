/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var prefs = require("../../../lib/prefs");
var toolbars = require("../../../lib/toolbars");

const gTimeout = 5000;

const localTestFolder = collector.addHttpResource('../../../data/');
const prefName = "keyword.URL";

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);

  prefs.preferences.setPref(prefName, localTestFolder + "search/searchresults.html?q=");
}

var teardownModule = function() {
  prefs.preferences.clearUserPref(prefName);
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

  // Check for presense of search term in return results count
  var resultsStringCheck = new elementslib.ID(controller.tabs.activeTab, "term");
  controller.assertText(resultsStringCheck, testString);
}

/**
 * Map test functions to litmus tests
 */
// testLocationBarSearches.meta = {litmusids : [8082]};
