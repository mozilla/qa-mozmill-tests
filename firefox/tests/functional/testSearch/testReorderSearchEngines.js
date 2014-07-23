/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { expect } = require("../../../../lib/assertions");
var search = require("../../../lib/search");

const DELAY = 0;

// Global variable to share engine names
var gSharedData = {preEngines: [ ], postEngines: [ ]};

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.searchBar = new search.searchBar(aModule.controller);
}

var teardownModule = function(aModule) {
  aModule.searchBar.restoreDefaultEngines();
}

/**
 * Manage search engine (Reordering)
 */
var testReorderEngines = function() {
  // Reorder the search engines a bit
  searchBar.openEngineManager(reorderEngines);

  // Reopen the dialog to retrieve the current sorting
  searchBar.openEngineManager(retrieveEngines);

  // Check the if the engines were sorted correctly in the manager
  var length = gSharedData.preEngines.length;
  expect.equal(gSharedData.preEngines[0].name, gSharedData.postEngines[1].name,
               "The previous first search engine is now the second one");
  expect.equal(gSharedData.preEngines[1].name, gSharedData.postEngines[2].name,
               "The previous second search engine is now the third one");
  expect.equal(gSharedData.preEngines[2].name, gSharedData.postEngines[0].name,
               "The previous third search engine is now the first one");

  // TODO: For now sleep 0ms to get the correct sorting order returned
  controller.sleep(0);

  // Check the ordering in the drop down menu
  var engines = searchBar.visibleEngines;
  for (var ii = 0; ii < engines.length; ii++) {
    expect.equal(engines[ii].name, gSharedData.postEngines[ii].name,
                 "The order in the drop down menu is consistent");
  }
}

/**
 * Reorder the search engines a bit
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var reorderEngines = function(aController)
{
  var manager = new search.engineManager(aController);
  var engines = manager.engines;

  // Move two of the engines down
  manager.moveDownEngine(engines[0].name); // [2-1-3]
  manager.controller.sleep(DELAY);
  manager.moveDownEngine(engines[0].name); // [2-3-1]
  manager.controller.sleep(DELAY);
  manager.moveDownEngine(engines[1].name); // [3-2-1]
  manager.controller.sleep(DELAY);

  // Move one engine up
  manager.moveUpEngine(engines[0].name); // [3-1-2]
  manager.controller.sleep(DELAY);

  // Save initial state
  gSharedData.preEngines = engines;

  manager.close(true);
}

/**
 * Get the new search order of the engines
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var retrieveEngines = function(aController)
{
  var manager = new search.engineManager(aController);

  // Save current state
  gSharedData.postEngines = manager.engines;

  manager.close(true);
}
