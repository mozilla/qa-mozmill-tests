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
 * Perform Basic Search
 * Puts a query in the GTB-SearchBox and checks if search is done.
 * @supported Firefox versions above or equal to 3.0
 *
 * @author ankush@google.com (Ankush Kalkote)
 */

var jumlib = {};
Components.utils.import('resource://mozmill/modules/jum.js', jumlib);

/* This is the currently supported method of Mozmill to import other test files.
 * RELATIVE_ROOT should give relative path of directory containing Apis or
 * utils.
 * MODULE_REQUIRES should list required module's names.
 * Note: This may became more elegant after Mozmill adds the feature for sharing
 * code across different tests.
 */
const RELATIVE_ROOT = '../../lib';
const MODULE_REQUIRES = ['SearchBoxAPI', 'SearchVerifyUtilsAPI', 'BrowserUtilsAPI',
                         'GtbUtilsAPI'];

/**
 * Timeout in milliseconds for testBasicSearch.
 * @type {number}
 */
const TIME_OUT_INSTALL_PING = 60000; // 1 min.

/**
 * Interval used for polling in milliseconds for testBasicSearch.
 * @type {number}
 */
const INTERVAL_INSTALL_PING = 100;

/**
 * Pref name corresponding to acknowledgement of install ping.
 * @type {string}
 */
const INSTALL_PING_ACK_PREF = 'install_ping_acked';

/**
 * Simple search query string.
 * @type {string}
 */
const QUERY_STRING_SIMPLE = 'hello';

/**
 * Sets up the test module by acquiring a browser controller.
 * It also initiates searchBoxApi object.
 * SetupModule is called before each test by Mozmill.
 * @param {Module} module object for the test used by Mozmill.
 */
var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  GtbUtilsAPI.ensureGtbIsUsable(controller);
  searchBoxApiObject = new SearchBoxAPI.SearchBoxAPI(controller);
  searchBoxApiObject.resetQuery();
};

/**
 * This is a test. It will be loaded by Mozmill.
 * It first puts a query in GTB-SearchBox. Then searches for the same.
 * It verifies correct url ping is sent.
 */
var testBasicSearch = function() {
  checkInstallPingAcked();
  searchAndVerifyForQuery(QUERY_STRING_SIMPLE);
};

/**
 * Verifies the install_ping_acked preference is set or not.
 * Since install ping can be delayed, this test performs polling.
 */
function checkInstallPingAcked() {
  var installPingSuccess = false;
  var prefs = BrowserUtilsAPI.getToolbarPrefsBranch();

  // Check if the install_ping_acked preference is set 'true' or not
  // by polling with the INTERVAL_INSTALL_PING.
  // If timed out, test fails.
  for (var timeElapsed = 0; timeElapsed < TIME_OUT_INSTALL_PING;
      timeElapsed += INTERVAL_INSTALL_PING) {
    try {
      if (prefs.getBoolPref(INSTALL_PING_ACK_PREF) == true) {
        installPingSuccess = true;
        break;
      }
    } catch (exception) {
      // This exception can be ignored; since the pref might not exist.
    }
    controller.sleep(INTERVAL_INSTALL_PING);
  }

  if (!installPingSuccess) {
    jumlib.fail('Install_ping_acked preference is not set to true,' +
                ' with timeout = ' + TIME_OUT_INSTALL_PING);
  }
}

/**
 * Performs search with queryString and then verifies the ping.
 * @param {string} queryString string for which to search and verify.
 */
function searchAndVerifyForQuery(queryString) {
  searchBoxApiObject.putNewQuery(queryString);

  // Just checks if suggestList appears; Exhaustive test in SearchHistory test.
  searchBoxApiObject.checkForSuggestList();

  searchBoxApiObject.performSearchByEnterKey();
  verifySearchResultsForQuery(controller, queryString);
}

/**
 * Verifies search ping sent by the google toolbar.
 * It checks for title and all parameters in the url.
 * @param {MozMillController} controller Mozmill controller of FF-window.
 * @param {string} query query String for which search need to be verified.
 */
function verifySearchResultsForQuery(controller, query) {
  // TODO(ankush): First check if default search engine is Google or not.
  SearchVerifyUtilsAPI.verifySearchResultsTitle(controller, query);
  SearchVerifyUtilsAPI.verifySearchResultsUrl(controller, query);
}
