/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var search = require("../../../lib/search");

const BASE_URL = collector.addHttpResource("../../../../data/");
const SEARCH_ENGINE = {
  name: "OpenSearch Test",
  url : BASE_URL + "search/opensearch.html"
};

const TIMEOUT_INSTALLATION = 30000;

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.searchBar = new search.searchBar(aModule.controller);
}

var teardownModule = function(aModule) {
  aModule.searchBar.removeEngine(SEARCH_ENGINE.name);
  aModule.searchBar.restoreDefaultEngines();
}

/**
 * Autodiscovery of OpenSearch search engines
 */
var testOpenSearchAutodiscovery = function() {
  // Open the test page with the test OpenSearch plugin
  controller.open(SEARCH_ENGINE.url);
  controller.waitForPageLoad();

  // Open search engine drop down and check for installable engines
  searchBar.enginesDropDownOpen = true;
  var addEngines = searchBar.installableEngines;
  assert.equal(addEngines.length, 1, "Autodiscovered OpenSearch Engines");

  // Install the new search engine which gets automatically selected
  var engine = searchBar.getElement({
    type: "engine",
    subtype: "title",
    value: addEngines[0].name
  });
  controller.waitThenClick(engine);

  assert.waitFor(function () {
    return searchBar.selectedEngine === SEARCH_ENGINE.name;
  }, "Search engine has been installed and selected - expected '" + SEARCH_ENGINE.name + "'", TIMEOUT_INSTALLATION);

  // Check if a search redirects to the YouTube website
  searchBar.search({text: "Firefox", action: "goButton"});

  // Clear search term and check the placeholder text
  var inputField = searchBar.getElement({type: "searchBar_input"});
  searchBar.clear();
  expect.equal(inputField.getNode().placeholder, SEARCH_ENGINE.name, "New engine is selected");
}
