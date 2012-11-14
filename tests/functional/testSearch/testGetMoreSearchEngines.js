/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { assert } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var search = require("../../../lib/search");
var utils = require("../../../lib/utils");

const PREF_SEARCH_ENGINES_URL = "browser.search.searchEnginesURL";

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const SEARCH_ENGINE_URL = LOCAL_TEST_FOLDER + "search/mozsearch.html";

function setupModule () {
  controller = mozmill.getBrowserController();

  searchBar = new search.searchBar(controller);

  prefs.preferences.setPref(PREF_SEARCH_ENGINES_URL, SEARCH_ENGINE_URL);
}

function teardownModule () {
  prefs.preferences.clearUserPref(PREF_SEARCH_ENGINES_URL);
}

/**
 * Get more search engines
 */
function testGetMoreEngines () {
  var tabCount = controller.tabs.length;

  // Open the engine manager and click "Get more search engines..."
  searchBar.openEngineManager(enginesHandler);

  assert.waitFor(function () {
    return controller.tabs.length === (tabCount + 1);
  }, "The 'Get More Engines' link has been opened in a new tab");
  controller.waitForPageLoad();

  utils.assertLoadedUrlEqual(controller, SEARCH_ENGINE_URL);
}

/**
 * Click on "Get more search engines" link in the manager
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var enginesHandler = function(controller)
{
  // Click Browse link - dialog will close automatically
  var browseLink = new elementslib.ID(controller.window.document, "addEngines");
  controller.waitThenClick(browseLink);
}
