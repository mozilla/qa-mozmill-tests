/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var {assert} = require("../../../lib/assertions");
var search = require("../../../lib/search");


function setupModule() {
  controller = mozmill.getBrowserController();

  searchBar = new search.searchBar(controller);
  searchEngines = searchBar.visibleEngines;

  // Get search engines that support suggestions
  enginesWithSuggestions = [ ];
  for (var i = 0; i < searchEngines.length; i++) {
    if(searchBar.hasSuggestions(searchEngines[i].name))
      enginesWithSuggestions.push(searchEngines[i]);
  }

  // Skip test if we have less than 2 search engines with suggestions
  if (enginesWithSuggestions.length < 2)
    testMultipleEngines.__force_skip__ = "At least two search engines with " +
                                         "suggestions are necessary for " +
                                         "comparison";
}

/**
 * Check suggestions for multiple search providers
 */
function testMultipleEngines() {
  var allSuggestions = [ ];
  var suggestionsForEngine;

  // Get suggested auto-complete results for two engines
  for (var i = 0; i < enginesWithSuggestions.length; i++) {
    searchBar.clear();

    // Select search engine
    searchBar.selectedEngine = enginesWithSuggestions[i].name;

    // Get suggestions
    suggestionsForEngine = searchBar.getSuggestions("Moz");
    if (suggestionsForEngine.length !== 0)
      allSuggestions.push(suggestionsForEngine);

    // Exit the for loop in case we have suggestions for 2 engines
    if (allSuggestions.length === 2)
      break;
  }

  assert.equal(allSuggestions.length, 2,
               "Suggestions from two search engines are available");

  // Check that at least one suggestion is different
  var different = false;
  var maxIndex = Math.max(allSuggestions[0].length, allSuggestions[1].length);
  for (i = 0; i < maxIndex; i++) {
    if (allSuggestions[0][i] !== allSuggestions[1][i]) {
      different = true;
      break;
    }
  }

  assert.ok(different, "Suggestions are different");
}
