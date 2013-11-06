/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var search = require("../../../lib/search");

const BASE_URL = collector.addHttpResource("../../../../data/");
const SEARCH_ENGINE = {
  name : "mozqa.com",
  url : BASE_URL + "search/mozsearch.html"
};

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.engineManager = new search.engineManager(aModule.controller);
  aModule.searchBar = new search.searchBar(aModule.controller);
}

var teardownModule = function(aModule) {
  aModule.searchBar.removeEngine(SEARCH_ENGINE.name);
  aModule.searchBar.restoreDefaultEngines();
}

/**
 * Add a MozSearch Search plugin
 */
var testAddMozSearchPlugin = function() {
  engineManager.installFromUrl(SEARCH_ENGINE.name, SEARCH_ENGINE.url, function () {
    var addButton = new elementslib.Name(controller.tabs.activeTab, "add");
    controller.click(addButton);
  });

  // Select search engine and start a search
  searchBar.selectedEngine = SEARCH_ENGINE.name;
  searchBar.search({text: "Firefox", action: "goButton"});
}
