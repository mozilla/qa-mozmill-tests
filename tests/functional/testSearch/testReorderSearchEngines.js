/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var search = require("../../../lib/search");

const gDelay   = 0;
const gTimeout = 5000;

// Global variable to share engine names
var gSharedData = {preEngines: [ ], postEngines: [ ]};

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
 * Manage search engine (Reordering)
 */
var testReorderEngines = function()
{
  // Reorder the search engines a bit
  searchBar.openEngineManager(reorderEngines);

  // Reopen the dialog to retrieve the current sorting
  searchBar.openEngineManager(retrieveEngines);

  // Check the if the engines were sorted correctly in the manager
  controller.assertJS("subject.preEngines[0].name == subject.postEngines[2].name",
                      {preEngines: gSharedData.preEngines, postEngines: gSharedData.postEngines});
  controller.assertJS("subject.preEngines[1].name == subject.postEngines[1].name",
                      {preEngines: gSharedData.preEngines, postEngines: gSharedData.postEngines});
  controller.assertJS("subject.preEngines[2].name == subject.postEngines[0].name",
                      {preEngines: gSharedData.preEngines, postEngines: gSharedData.postEngines});
  controller.assertJS("subject.preEngines[subject.length - 1].name == subject.postEngines[subject.length - 2].name",
                      {preEngines: gSharedData.preEngines, postEngines: gSharedData.postEngines,
                       length: gSharedData.preEngines.length});

  // XXX: For now sleep 0ms to get the correct sorting order returned
  controller.sleep(0);

  // Check the ordering in the drop down menu
  var engines = searchBar.visibleEngines;
  for (var ii = 0; ii < engines.length; ii++) {
    controller.assertJS("subject.visibleEngine.name == subject.expectedEngine.name",
                        {visibleEngine: engines[ii], expectedEngine: gSharedData.postEngines[ii]});
  }
}

/**
 * Reorder the search engines a bit
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var reorderEngines = function(controller)
{
  var manager = new search.engineManager(controller);
  var engines = manager.engines;

  // Move two of the engines down
  manager.moveDownEngine(engines[0].name); // [2-1-3]
  manager.controller.sleep(gDelay);
  manager.moveDownEngine(engines[0].name); // [2-3-1]
  manager.controller.sleep(gDelay);
  manager.moveDownEngine(engines[1].name); // [3-2-1]
  manager.controller.sleep(gDelay);

  // Move one engine up
  manager.moveUpEngine(engines[engines.length - 1].name);
  manager.controller.sleep(gDelay);

  // Save initial state
  gSharedData.preEngines = engines;

  manager.close(true);
}

/**
 * Get the new search order of the engines
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var retrieveEngines = function(controller)
{
  var manager = new search.engineManager(controller);

  // Save current state
  gSharedData.postEngines = manager.engines;

  manager.close(true);
}
