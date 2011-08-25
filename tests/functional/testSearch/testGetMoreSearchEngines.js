/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
 *   Alex Lakatos <alex.lakatos@softvision.ro>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Include the required modules
var modalDialog = require("../../../lib/modal-dialog");
var search = require("../../../lib/search");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;
const TIMEOUT_INSTALL_DIALOG = 30000;

const searchEngine = {name: "IMDB",
                      url : "https://addons.mozilla.org/en-US/firefox/addon/imdb"};

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
  // Check that the search engine is not installed yet
  controller.assertJS("subject.isEngineInstalled == false",
                      {isEngineInstalled: searchBar.isEngineInstalled(searchEngine.name)});

  // Open the engine manager to browse the search directory
  var tabCount = controller.tabs.length;
  searchBar.openEngineManager(enginesHandler);

  controller.waitForEval("subject.tabs.length == (subject.preCount + 1)", TIMEOUT, 100,
                         {tabs: controller.tabs, preCount: tabCount});
  controller.waitForPageLoad();

  // Install the engine from the Open the search provider page before installing the engine
  controller.open(searchEngine.url);
  controller.waitForPageLoad();

  // XXX: Bug 575241
  // AMO Lazy install buttons: wait for class change
  var installButton = new elementslib.Selector(controller.tabs.activeTab,
                                               ".installer");

  controller.waitForEval("subject.installButtonClass.indexOf('installer') != -1", TIMEOUT, 100,
                        {installButtonClass: installButton.getNode().getAttribute('class')});

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

/**
 * Map test functions to litmus tests
 */
// setupModule.meta = {litmusids : [8238]};
