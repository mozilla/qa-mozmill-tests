/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var search = require("../../../lib/search");

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.searchBar = new search.searchBar(controller);
}

var teardownModule = function(aModule) {
  aModule.searchBar.restoreDefaultEngines();
}

/**
 * Manage search engine (Remove)
 */
var testRemoveEngine = function() {
  var engine = searchBar.visibleEngines[1];

  // Remove the first engine in the list
  searchBar.openEngineManager(handleEngines);

  assert.waitFor(function () {
    return engine.name !== searchBar.visibleEngines[1].name;
  }, "Search engine " + engine.name + " has been removed");
}

/**
 * Remove a search engine from the list of available search engines
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var handleEngines = function(aController) {
  var manager = new search.engineManager(aController);

  // Remove the second search engine
  var engines = manager.engines;
  expect.ok(engines.length > 1, "There is more than one search engine");
  manager.removeEngine(engines[1].name);

  manager.close(true);
}
