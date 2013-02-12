/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var search = require("../../../lib/search");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER +
                        'search/searchresults.html?q={searchTerms}';

function setupModule() {
  controller = mozmill.getBrowserController();
  searchBar = new search.searchBar(controller);

  searchBar.installEngine("Test Search Engine", LOCAL_TEST_PAGE,
                          {selected: true});
}

function teardownModule() {
  searchBar.clear();
  searchBar.restoreDefaultEngines();
}

/**
 * Use the keyboard shortcut to focus the search bar and start a search
 */
function testShortcutAndSearch() {
  searchBar.focus({type: "shortcut"});
  searchBar.search({text: "Mozilla", action: "goButton"});
}
