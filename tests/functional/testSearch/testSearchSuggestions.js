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
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <hskupin@mozilla.com>
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
var {assert} = require("../../../lib/assertions");
var search = require("../../../lib/search");


function setupModule() {
  controller = mozmill.getBrowserController();

  searchBar = new search.searchBar(controller);
  searchEngines = searchBar.visibleEngines;

  // Get search engines that support suggestions
  enginesWithSuggestions = [ ];
  for (var i = 0; i < searchEngines.length; i++) {
    if(searchBar.hasSuggestions(searchEngines[i].name))
      enginesWithSuggestions.push(searchEngines[i]);
  }

  // Skip test if we have less than 2 search engines with suggestions
  if (enginesWithSuggestions.length < 2)
    testMultipleEngines.__force_skip__ = "At least two search engines with " +
                                         "suggestions are necessary for " +
                                         "comparison";
}

/**
 * Check suggestions for multiple search providers
 */
function testMultipleEngines() {
  var allSuggestions = [ ];
  var suggestionsForEngine;

  // Get suggested auto-complete results for two engines
  for (var i = 0; i < enginesWithSuggestions.length; i++) {
    searchBar.clear();

    // Select search engine
    searchBar.selectedEngine = enginesWithSuggestions[i].name;

    // Get suggestions
    suggestionsForEngine = searchBar.getSuggestions("Moz");
    if (suggestionsForEngine.length !== 0)
      allSuggestions.push(suggestionsForEngine);

    // Exit the for loop in case we have suggestions for 2 engines
    if (allSuggestions.length === 2)
      break;
  }

  assert.equal(allSuggestions.length, 2,
               "Suggestions from two search engines are available");

  // Check that at least one suggestion is different
  var different = false;
  var maxIndex = Math.max(allSuggestions[0].length, allSuggestions[1].length);
  for (i = 0; i < maxIndex; i++) {
    if (allSuggestions[0][i] !== allSuggestions[1][i]) {
      different = true;
      break;
    }
  }

  assert.ok(different, "Suggestions are different");
}
