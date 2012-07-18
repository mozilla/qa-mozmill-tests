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
 *   Remus Pop <remus.pop@softvision.ro>
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
var { expect } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var search = require("../../../lib/search");
var utils = require("../../../lib/utils");

const PREF_SEARCH_ENGINES_URL = "browser.search.searchEnginesURL";

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const SEARCH_ENGINE_URL = LOCAL_TEST_FOLDER + "search/mozsearch.html";

function setupModule () {
  controller = mozmill.getBrowserController();

  searchBar = new search.searchBar(controller);

  prefs.preferences.setPref(PREF_SEARCH_ENGINES_URL, SEARCH_ENGINE_URL);
}

function teardownModule () {
  prefs.preferences.clearUserPref(PREF_SEARCH_ENGINES_URL);
}

/**
 * Get more search engines
 */
function testGetMoreEngines () {
  var tabCount = controller.tabs.length;

  // Open the engine manager and click "Get more search engines..."
  searchBar.openEngineManager(enginesHandler);

  controller.waitFor(function () {
    return controller.tabs.length === (tabCount + 1);
  }, "The 'Get More Engines' link has been opened in a new tab");
  controller.waitForPageLoad();

  utils.assertLoadedUrlEqual(controller, SEARCH_ENGINE_URL);
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
