/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert } = require("../../../../lib/assertions");
var search = require("../../../lib/search");

const BASE_URL = collector.addHttpResource("../../../../data/");
const SEARCH_ENGINES = [
  { name: "mozqa.com", url: BASE_URL + "search/mozsearch.html" },
  { name: "OpenSearch Test", url: BASE_URL + "search/opensearch.html" }
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.engineManager = new search.engineManager(aModule.controller);
  aModule.searchBar = new search.searchBar(aModule.controller);
}

function teardownModule(aModule) {
  aModule.searchBar.clear();
  aModule.searchBar.restoreDefaultEngines();
}

/**
 * Check suggestions for multiple search providers
 */
function testMultipleEngines() {
  var allSuggestions = [ ];
  var suggestionsForEngine;
  var searchEngines = [ ];

  SEARCH_ENGINES.forEach((aEngine) => {
    engineManager.installFromUrl(aEngine.name, aEngine.url, function () {
      var addButton = new elementslib.Name(controller.tabs.activeTab, "add");
      addButton.click();
    });
  });

  // Get suggested auto-complete results for two engines
  SEARCH_ENGINES.forEach((aEngine) => {
    searchBar.clear();
    searchBar.selectedEngine = aEngine.name;

    // Get suggestions
    suggestionsForEngine = searchBar.getSuggestions("mo");
    if (suggestionsForEngine.length !== 0) {
      allSuggestions.push(suggestionsForEngine);
      searchEngines.push(searchBar.selectedEngine);
    }
  });

  assert.equal(allSuggestions.length, 2,
               "Suggestions from two search engines are available");

  // Check that at least one suggestion is different
  var different = false;
  var maxIndex = Math.max(allSuggestions[0].length, allSuggestions[1].length);
  for (var i = 0; i < maxIndex; i++) {
    if (allSuggestions[0][i] !== allSuggestions[1][i]) {
      different = true;
      break;
    }
  }

  assert.ok(different, "Suggestions " + allSuggestions[0].join(", ") + " from " +
            searchEngines[0] + " and " + searchEngines[1] + " search providers are different");
}

