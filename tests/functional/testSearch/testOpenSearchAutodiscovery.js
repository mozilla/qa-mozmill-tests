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
 *   Anthony Hughes <ahughes@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
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
var {assert, expect} = require("../../../lib/assertions");
var search = require("../../../lib/search");

const TIMEOUT_INSTALLATION = 30000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');

const SEARCH_ENGINE = {
  name: "OpenSearch Test",
  url : LOCAL_TEST_FOLDER + 'search/opensearch.html'
};

var setupModule = function() {
  controller = mozmill.getBrowserController();

  searchBar = new search.searchBar(controller);
}

var teardownModule = function() {
  searchBar.removeEngine(SEARCH_ENGINE.name);
  searchBar.restoreDefaultEngines();
}

/**
 * Autodiscovery of OpenSearch search engines
 */
var testOpenSearchAutodiscovery = function() {
  // Open the test page with the test OpenSearch plugin
  controller.open(SEARCH_ENGINE.url);
  controller.waitForPageLoad();

  // Open search engine drop down and check for installable engines
  searchBar.enginesDropDownOpen = true;
  var addEngines = searchBar.installableEngines;
  assert.equal(addEngines.length, 1, "Autodiscovered OpenSearch Engines");

  // Install the new search engine which gets automatically selected
  var engine = searchBar.getElement({
    type: "engine",
    subtype: "title",
    value: addEngines[0].name
  });
  controller.waitThenClick(engine);

  controller.waitFor(function () {
    return searchBar.selectedEngine === SEARCH_ENGINE.name;
  }, "Search engine has been installed and selected - got '" + searchBar.selectedEngine +
    "', expected '" + SEARCH_ENGINE.name + "'", TIMEOUT_INSTALLATION);

  // Check if a search redirects to the YouTube website
  searchBar.search({text: "Firefox", action: "goButton"});

  // Clear search term and check the placeholder text
  var inputField = searchBar.getElement({type: "searchBar_input"});
  searchBar.clear();
  expect.equal(inputField.getNode().placeholder, SEARCH_ENGINE.name, "New engine is selected");
}

// XXX: Bug 685854 - Failure in /testSearch/testOpenSearchAutodiscovery.js |
// controller.assertJS: Failed for 'subject.installableEngines.length == 1'
setupModule.__force_skip__ = "Bug 685854 - Failure in /testSearch/testOpenSearchAutodiscovery.js " +
                             "| controller.assertJS: Failed for 'subject.installableEngines.length == 1'";
teardownModule.__force_skip__ = "Bug 685854 - Failure in /testSearch/testOpenSearchAutodiscovery.js " +
                                "| controller.assertJS: Failed for 'subject.installableEngines.length == 1'";
