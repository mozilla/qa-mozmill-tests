/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { assert } = require("../../../lib/assertions");
var modalDialog = require("../../../lib/modal-dialog");
var search = require("../../../lib/search");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;
const TIMEOUT_INSTALL_DIALOG = 30000;

const searchEngine = {name: "IMDB",
                      url : "https://addons.mozilla.org/en-US/firefox/addon/imdb/"};

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  searchBar = new search.searchBar(controller);
}

var teardownModule = function(module)
{
  searchBar.removeEngine(searchEngine.name);
  searchBar.restoreDefaultEngines();
}

/**
 * Get more search engines
 */
var testGetMoreEngines = function()
{
  assert.ok(!searchBar.isEngineInstalled(searchEngine.name),
            "The specified search engine has not been installed");

  // Open the engine manager to browse the search directory
  var tabCount = controller.tabs.length;
  searchBar.openEngineManager(enginesHandler);

  controller.waitFor(function () {
    return controller.tabs.length === (tabCount + 1);
  }, "The 'Get More Engines' link has been opened in a new tab");
  controller.waitForPageLoad();

  // Install the engine from the Open the search provider page before installing the engine
  controller.open(searchEngine.url);
  controller.waitForPageLoad();

  // XXX: Bug 575241
  // AMO Lazy install buttons: wait for class change
  var installButton = new elementslib.Selector(controller.tabs.activeTab,
                                               ".installer");

  controller.waitFor(function () {
    return installButton.getNode().getAttribute('class').indexOf('installer') !== -1;
  }, "The button class has been changed");

  // Create a modal dialog instance to handle the engine installation dialog
  var md = new modalDialog.modalDialog(controller.window);
  md.start(handleSearchInstall);

  // Install the search engine
  var triggerLink = new elementslib.Selector(controller.tabs.activeTab,
                                             ".installer");
  controller.waitThenClick(triggerLink, TIMEOUT);
  md.waitForDialog(TIMEOUT_INSTALL_DIALOG);

  controller.waitFor(function () {
    return searchBar.isEngineInstalled(searchEngine.name);
  }, "Search engine '" + searchEngine.name + "' has been installed");

  searchBar.selectedEngine = searchEngine.name;
  searchBar.search({text: "Firefox", action: "returnKey"});
}

/**
 * Click on "Get more search engines" link in the manager
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var enginesHandler = function(controller)
{
  // Click Browse link - dialog will close automatically
  var browseLink = new elementslib.ID(controller.window.document, "addEngines");
  controller.waitThenClick(browseLink);
}

/**
 * Handle the modal security dialog when installing a new search engine
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
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

  controller.assert(function () {
    return title.windowTitle === confirmTitle.addEngineTitle;
  }, "Window contains search engine title - got '" + title.windowTitle +
    "', expected '" + confirmTitle.addEngineTitle + "'");

  // Check that addons.mozilla.org is shown as domain
  var infoBody = controller.window.document.getElementById("info.body");
  controller.waitFor(function () {
    return infoBody.textContent.indexOf('addons.mozilla.org') !== -1;
  }, "Search Engine URL contains correct domain - got '" + infoBody.textContent +
    "', expected 'addons.mozilla.org'");

  var addButton = new elementslib.Lookup(controller.window.document,
                                         '/id("commonDialog")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}')
  controller.waitThenClick(addButton);
}


setupModule.__force_skip__ = "Bug 769218 - Test failure 'Disconnect Error: Application unexpectedly closed' in testGetMoreSearchEngines.js";
teardownModule.__force_skip__ = "Bug 769218 - Test failure 'Disconnect Error: Application unexpectedly closed' in testGetMoreSearchEngines.js";
