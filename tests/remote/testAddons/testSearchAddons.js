/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 // Include required modules
var { assert } = require("../../../lib/assertions");
var addons = require("../../../lib/addons");
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var toolbars = require("../../../lib/toolbars");

const NUMBER_OF_MAX_RESULTS = 2;
const PREF_MAX_RESULTS = "extensions.getAddons.maxResults";

var setupModule = function () {
  controller = mozmill.getBrowserController();
  am = new addons.AddonsManager(controller);
  locationBar = new toolbars.locationBar(controller);
  tabBrowser = new tabs.tabBrowser(controller);

  addons.useAmoPreviewUrls();
  prefs.preferences.setPref(PREF_MAX_RESULTS, NUMBER_OF_MAX_RESULTS);
  tabBrowser.closeAllTabs();
 }

var teardownModule = function () {
  prefs.preferences.clearUserPref(PREF_MAX_RESULTS);
  addons.resetAmoPreviewUrls();
  tabBrowser.closeAllTabs();
 }

 /**
  * Test the search for Add-ons
  */
var testSearchAddons = function () {
  am.open();

  // Search for any Add-on's with 'rss'
  am.search({value: "rss"});
  am.selectedSearchFilter = "remote";

  // Verify that results have returned and the max number of results
  var resultsLength = am.getSearchResults().length;
  assert.ok(resultsLength > 0, "Addons have been found");

  // Verify that we have a maximum of two results with these parameters
  assert.ok(resultsLength <= NUMBER_OF_MAX_RESULTS,
            "Number of addons are less or equal than: " + NUMBER_OF_MAX_RESULTS);

  // Verify that clicking the 'Show All Results' link opens a new tab on AMO
  var allResultsLink = am.getElements({type:"allResults"})[0];
  controller.click(allResultsLink);
  assert.waitFor(function () {
    return tabBrowser.selectedIndex === 2;
  }, "Show all results tab has been selected");
  controller.waitForPageLoad();

  // Verify that the URL contains an AMO address
  assert.contain(locationBar.value, addons.AMO_PREVIEW_DOMAIN,
                 "The URL contains the correct address ");
 }

