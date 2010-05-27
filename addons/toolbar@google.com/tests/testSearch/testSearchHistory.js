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
 * The Original Code is Google toolbar mozmill test suite.
 *
 * The Initial Developer of the Original Code is Google.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Ankush Kalkote <ankush@google.com>
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

/**
 * @fileoverview Mozmill test corresponding to:
 * Search history and Suggestions.
 * Performs few searches in GTB search box. verifies history items show in
 * reverse chronological order.
 *
 * @author ankush@google.com (Ankush Kalkote)
 */

var jumlib = {};
Components.utils.import('resource://mozmill/modules/jum.js', jumlib);

const RELATIVE_ROOT = '../../shared-modules';
const MODULE_REQUIRES = ['SearchBoxAPI', 'ArrayUtilsAPI', 'GtbUtilsAPI'];

const QUERY_LIST = ['hello', 'world'];

/**
 * SetupModule is called before each test.
 * It sets up the test module by acquiring a browser controller. It also creates
 * searchBoxApi object and clears search history.
 * @param {module} module object for the test used by Mozmill.
 */
var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  GtbUtilsAPI.ensureGtbIsUsable(controller);
  searchBoxApiObject = new SearchBoxAPI.SearchBoxAPI(controller);

  searchBoxApiObject.resetQuery();
  searchBoxApiObject.clickClearSearchHistory();
};

/**
 * It populates search history with few keywords and then retrieves history it
 * from search box by clicking on history-drop-marker. Verifies if the history
 * items are correct.
 * @param {module} module object for the test used by Mozmill.
 */
var testSearchHistory = function(module) {
  searchBoxApiObject.populateSearchHistory(QUERY_LIST);

  var historyList = searchBoxApiObject.getHistoryFromPopDown();
  verifyHistoryListItems(QUERY_LIST, historyList);
};

/**
 * Checks if the historyList contains same items as queryList and in the
 * reverse chronological order.
 * @param {Array} queryList list of gtb search queries.
 * @param {Array} historyList list of history items.
 */
function verifyHistoryListItems(queryList, historyList) {
  var queryListReversed = queryList.reverse(); // Chronological order
  jumlib.assertTrue(ArrayUtilsAPI.checkArraysEqual(queryListReversed, historyList),
                    'QueryArray and HistoryArray are not equal, QueryArray: ' +
                    queryListReversed.join() + ' HistoryArray: ' +
                    historyList.join());
}
