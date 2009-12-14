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

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['ModalDialogAPI', 'SearchAPI', 'UtilsAPI'];

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();
  search = new SearchAPI.searchEngine(controller);

  // Variable for the new engine name
  engineName = null;
}

var teardownModule = function(module)
{
  if (engineName)
    search.remove(engineName);
  search.clear();
}

/**
 * Get more search engines
 */
var testGetMoreEngines = function()
{
  // Get information about the current search engines
  var preEngines = search.getVisibleEngines();
  var preEngineCount = preEngines.length;
  var preLastEngine = preEngines[preEngineCount - 1].QueryInterface(Ci.nsISearchEngine);

  // Open the engine manager to browse the search directory
  var tabCount = controller.tabs.length;
  search.openManager(handleEngines);
  controller.waitForEval("subject.length == " + (tabCount + 1), gTimeout, 100,
                         controller.tabs);
  controller.waitForPageLoad();

  // Open the search provider page before installing the engine
  // XXX: Until bug 519690 isn't fixed we have to use a search engine without "/" in the name
  //var detailsLink = new elementslib.XPath(controller.tabs.activeTab, "/html/body[@id='mozilla-com']/div/div[@id='browse']/div[2]/div[@id='addon-listing']/div[2]/a/img");
  //controller.click(detailsLink);
  controller.open("https://addons.mozilla.org/en-US/firefox/addon/10772");
  controller.waitForPageLoad();

  // Create a modal dialog instance to handle the engine installation dialog
  var md = new ModalDialogAPI.modalDialog(handleSearchInstall);
  md.start();

  // Install the search engine
  var triggerLink = new elementslib.XPath(controller.tabs.activeTab, "/html/body[@id='mozilla-com']/div/div[@id='addon']/div/div/div[@id='addon-summary-wrapper']/div[@id='addon-summary']/div[@id='addon-install']/div[1]/p/a/span");
  controller.waitThenClick(triggerLink, gTimeout);

  controller.waitForEval("subject.getVisibleEngines().length == " + (preEngineCount + 1),
                         gTimeout, 100, search);
  postLastEngine = search.getVisibleEngines()[preEngineCount].QueryInterface(Ci.nsISearchEngine);
  engineName = postLastEngine.name;

  search.select(engineName);
  search.search("amazon");
}

/**
 * Remove a search engine from the list of available search engines
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var handleEngines = function(controller)
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
  var confirmTitle = UtilsAPI.getProperty("chrome://global/locale/search/search.properties",
                                          "addEngineConfirmTitle");

  if (mozmill.isMac)
    var title = controller.window.document.getElementById("info.title").textContent;
  else
    var title = controller.window.document.title;

  controller.assertJS(title == confirmTitle);

  // Check that litmus.mozilla.org is shown as domain
  var infoBody = controller.window.document.getElementById("info.body");
  controller.waitForEval("subject.textContent.indexOf('addons.mozilla.org') != -1",
                         gTimeout, 100, infoBody);

  var addButton = new elementslib.Lookup(controller.window.document, '/id("commonDialog")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}')
  controller.click(addButton);
}

/**
 * Map test functions to litmus tests
 */
setupModule.meta = {litmusids : [8238]};
