/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {expect} = require("../../../lib/assertions");
var modalDialog = require("../../../lib/modal-dialog");
var search = require("../search");
var utils = require("../../../lib/utils");

const DELAY = 500;

var setupModule = function(aModule) {
  controller = mozmill.getBrowserController();

  searchBar = new search.searchBar(controller);
  searchBar.clear();
}

var teardownModule = function(aModule) {
  searchBar.clear();
  searchBar.restoreDefaultEngines();
}

/**
 * Add a MozSearch Search plugin
 */
var testSearchAPI = function() {
  // Check if Google is installed and there is no Googl engine present
  expect.ok(searchBar.isEngineInstalled("Google"), "Google search engine is installed");
  expect.ok(!searchBar.isEngineInstalled("Googl"), "Googl search engine is not present");

  // Do some stuff in the Search Engine Manager
  searchBar.openEngineManager(handlerManager);

  // Select another engine and start search
  searchBar.selectedEngine = "Yahoo";
  searchBar.search({text: "Firefox", action: "returnKey"});
}

var handlerManager = function(aController) {
  var manager = new search.engineManager(aController);
  var engines = manager.engines;

  // Remove the first search engine
  manager.removeEngine(engines[3].name);
  manager.controller.sleep(DELAY);

  // Move engines down / up
  manager.moveDownEngine(engines[0].name);
  manager.moveUpEngine(engines[2].name);
  manager.controller.sleep(DELAY);

  // Add a keyword for the first engine
  manager.editKeyword(engines[0].name, handlerKeyword);
  manager.controller.sleep(DELAY);

  // Restore the defaults
  manager.restoreDefaults();
  manager.controller.sleep(DELAY);

  // Disable suggestions
  manager.suggestionsEnabled = false;
  manager.controller.sleep(DELAY);

  manager.getMoreSearchEngines();

  // Dialog closes automatically
  //manager.close(true);
}

var handlerKeyword = function(aController) {
  var textbox = new elementslib.ID(aController.window.document, "loginTextbox");
  aController.type(textbox, "g");

  var okButton = new elementslib.Lookup(aController.window.document,
                                        '/id("commonDialog")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  aController.click(okButton);
}
