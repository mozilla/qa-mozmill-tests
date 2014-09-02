/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var search = require("../../../lib/search");

// Global variable to share engine names
var gSharedData = { preEngines: [ ] };

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.searchBar = new search.searchBar(aModule.controller);
}

function teardownModule(aModule) {
  aModule.searchBar.restoreDefaultEngines();
}

/**
 * Manage search engine (Restoring Defaults)
 */
function testRestoreDefaultEngines() {
  // Remove some default search engines
  searchBar.openEngineManager(removeEngines);

  // Reopen the dialog to restore the defaults
  searchBar.openEngineManager(restoreEngines);

  // TODO: For now sleep 0ms to get the correct sorting order returned
  controller.sleep(0);

  // Check the ordering in the drop down menu
  var engines = searchBar.visibleEngines;
  for (var i = 0; i < engines.length; i++) {
    expect.equal(engines[i].name, gSharedData.preEngines[i].name,
                 "Engine has been restored at the correct position.")
  }
}

/**
 * Remove some of the default search engines
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function removeEngines(aController) {
  var manager = new search.engineManager(aController);

  // Save initial state
  gSharedData.preEngines = manager.engines;

  // Remove all engines until only 1 is left
  for (var i = manager.engines.length; i > 1; i--) {
    var name = manager.engines[i - 1].name;

    manager.removeEngine(name);
    assert.waitFor(function () {
      return manager.engines.length === i - 1;
    }, "Engine '" + name + "' has been removed.");
  }

  manager.close(true);
}

/**
 * Restore the default engines
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function restoreEngines(aController) {
  var manager = new search.engineManager(aController);

  manager.restoreDefaults();
  manager.close(true);
}
