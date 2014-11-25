/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var search = require("../../../lib/search");
var utils = require("../../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "search/mozsearch.html";

const PREF_SEARCH_ENGINES_URL = "browser.search.searchEnginesURL";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.searchBar = new search.searchBar(aModule.controller);

  prefs.setPref(PREF_SEARCH_ENGINES_URL, TEST_DATA);
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_SEARCH_ENGINES_URL);
}

/**
 * Get more search engines
 */
function testGetMoreEngines() {
  var tabCount = controller.tabs.length;

  // Open the engine manager and click "Get more search engines..."
  searchBar.openEngineManager(enginesHandler);

  assert.waitFor(function () {
    return controller.tabs.length === (tabCount + 1);
  }, "The 'Get More Engines' link has been opened in a new tab");
  controller.waitForPageLoad();

  utils.assertLoadedUrlEqual(controller, TEST_DATA);
}

/**
 * Click on "Get more search engines" link in the manager
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var enginesHandler = function(aController) {
  // Click Browse link - dialog will close automatically
  var browseLink = new elementslib.ID(aController.window.document, "addEngines");
  aController.waitThenClick(browseLink);
}
