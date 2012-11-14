/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { assert, expect } = require("../../../lib/assertions");
var search = require("../../../lib/search");

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  searchBar = new search.searchBar(controller);
}

var teardownModule = function(module)
{
  searchBar.restoreDefaultEngines();
}

/**
 * Manage search engine (Remove)
 */
var testRemoveEngine = function()
{
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
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var handleEngines = function(controller)
{
  var manager = new search.engineManager(controller);

  // Remove the second search engine
  var engines = manager.engines;
  expect.ok(engines.length > 1, "There is more than one search engine");
  manager.removeEngine(engines[1].name);

  manager.close(true);
}

/**
 * Map test functions to litmus tests
 */
// testRemoveEngine.meta = {litmusids : [8240]};
