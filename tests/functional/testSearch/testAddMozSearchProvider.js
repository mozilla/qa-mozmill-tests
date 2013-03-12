/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { assert, expect } = require("../../../lib/assertions");
var modalDialog = require("../../../lib/modal-dialog");
var search = require("../../../lib/search");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');

const TIMEOUT_INSTALL_DIALOG = 30000;

const SEARCH_ENGINE = {name: "mozqa.com",
                       url : LOCAL_TEST_FOLDER + "search/mozsearch.html"};

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  searchBar = new search.searchBar(controller);
}

var teardownModule = function(module)
{
  searchBar.removeEngine(SEARCH_ENGINE.name);
  searchBar.restoreDefaultEngines();
}

/**
 * Add a MozSearch Search plugin
 */
var testAddMozSearchPlugin = function()
{
  // Open the web page with the test MozSearch plugin
  controller.open(SEARCH_ENGINE.url);
  controller.waitForPageLoad();

  // Create a modal dialog instance to handle the installation dialog
  var md = new modalDialog.modalDialog(controller.window);
  md.start(handleSearchInstall);

  // Add the search engine
  var addButton = new elementslib.Name(controller.tabs.activeTab, "add");
  controller.click(addButton);
  md.waitForDialog(TIMEOUT_INSTALL_DIALOG);

  assert.waitFor(function () {
    return searchBar.isEngineInstalled(SEARCH_ENGINE.name);
  }, "Search engine '" + SEARCH_ENGINE.name + "' has been installed");

  // The engine should not be selected by default
  expect.notEqual(searchBar.selectedEngine, SEARCH_ENGINE.name,
                  "New search engine is not selected");

  // Select search engine and start a search
  searchBar.selectedEngine = SEARCH_ENGINE.name;
  searchBar.search({text: "Firefox", action: "goButton"});
}

/**
 * Handle the modal security dialog when installing a new search engine
 *
 * @param {MozMillController} controller
 *        MozMillController of the browser window to operate on
 */
var handleSearchInstall = function(controller)
{
  // Installation successful?
  var confirmTitle = utils.getProperty("chrome://global/locale/search/search.properties",
                                       "addEngineConfirmTitle");

  if (mozmill.isMac)
    var title = controller.window.document.getElementById("info.title").textContent;
  else
    var title = controller.window.document.title;

  expect.equal(title.windowTitle, confirmTitle.addEngineTitle,
               "Window contains search engine title");

  // Check that the correct domain is shown
  var infoBody = controller.window.document.getElementById("info.body");
  assert.waitFor(function () {
    return infoBody.textContent.indexOf('localhost') !== -1;
  }, "Search Engine URL contains correct domain - got '" + infoBody.textContent +
    "', expected 'localhost'");

  var addButton = new elementslib.Lookup(controller.window.document,
                                         '/id("commonDialog")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  controller.click(addButton);
}

/**
 * Map test functions to litmus tests
 */
// testAddMozSearchPlugin.meta = {litmusids : [8235]};
