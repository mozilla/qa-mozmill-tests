/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var search = require("../../../lib/search");

const BASE_URL = collector.addHttpResource("../../../data/");
const TEST_DATA = BASE_URL + "search/searchresults.html?q={searchTerms}";

function setupModule() {
  controller = mozmill.getBrowserController();
  searchBar = new search.searchBar(controller);

  searchBar.installEngine("Test Search Engine", TEST_DATA, {selected: true});
}

function teardownModule() {
  searchBar.clear();
  searchBar.restoreDefaultEngines();
}

/**
 * Use the mouse to focus the search bar and start a search
 */
function testClickAndSearch() {
  searchBar.focus({type: "click"});
  searchBar.search({text: "Firefox", action: "returnKey"});
}
