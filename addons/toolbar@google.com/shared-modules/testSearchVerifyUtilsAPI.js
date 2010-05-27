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
 * @fileoverview This file contains functions needed for Verification of search
 * feature. Note that Functions interacting with GTB search box should go in
 * SearchBoxApi. This is NOT a test file.
 * @supported Firefox versions above or equal to 3.0
 *
 * @author ankush@google.com (Ankush Kalkote)
 */

const MODULE_NAME = 'SearchVerifyUtilsAPI';

const RELATIVE_ROOT = '.';
const MODULE_REQUIRES = ['BrowserUtilsAPI', 'LocalizationUtilsAPI', 'GtbUtilsAPI'];

var frame = {};
Components.utils.import('resource://mozmill/modules/frame.js', frame);

var jumlib = {};
Components.utils.import('resource://mozmill/modules/jum.js', jumlib);

// Parameter Names in Search Ping.
const HL_PARAM_NAME = 'hl';
const Q_PARAM_NAME = 'q';
const SOURCEID_PARAM_NAME = 'sourceid';
const RLZ_PARAM_NAME = 'rlz';
const IE_PARAM_NAME = 'ie';
 
/**
 * Parameter Values in Search Ping.
 * @type {string}
 */
const SOURCE_ID = 'navclient-ff';
const CHAR_CODE = 'UTF-8';
const GOOGLE_NAME_TITLE = 'Google';

/**
 * Number of search parameters.
 * @type {number}
 */
const NUMBER_OF_PARAM = 5;

/**
 * Verifies title contain both query string and name of search engine.
 * @param {MozMillController} controller Mozmill controller of FF-window.
 * @param {string} query queryString.
 */
function verifySearchResultsTitle(controller, query) {
  /* To import browserUtils. If the file is not test-file then we need to
   * explicitly call getModule function. collector is defined in Mozmill code.
   */
  var browserUtils = collector.getModule('BrowserUtilsAPI');
  var title = browserUtils.getTitle(controller);

  jumlib.assertNotNull(title.match(query), 'query not found in title');
  jumlib.assertNotNull(title.match(GOOGLE_NAME_TITLE),
                       'The name Google not found in title');
}

/**
 * Verifies the FF browser url contains correct search paramaters.
 * e.g. verfies parameters in url like q, hl, rlz, source-id, ie.
 * @param {MozMillController} controller Mozmill controller of FF-window.
 * @param {string} query queryString.
 */
function verifySearchResultsUrl(controller, query) {
  var browserUtils = collector.getModule('BrowserUtilsAPI');
  var localizationUtils = collector.getModule('LocalizationUtilsAPI');

  var url = browserUtils.getUrl(controller);
  var urlStringParsed = url.split('?'); // Split on a question mark.
  jumlib.assert(urlStringParsed[0].indexOf('google') > -1,
                'URL string does not contain google');

  var ffLanguage = browserUtils.getNavigatorLanguage(controller);
  var ftbLocale = localizationUtils.getFTBLocaleForLanguage(ffLanguage);

  verifyUrlParameters(urlStringParsed[1], query, ftbLocale);
}

/**
 * Verifies all the parameter names and corresponding values in the url part.
 * eg. The urlPart is
 * "hl=en&q=hello&sourceid=navclient-ff&rlz=1B3GGGL_enUS322IN331&ie=UTF-8".
 * @param {string} urlPart url string part that contains parameters and values.
 * @param {string} query Query string.
 * @param {string} ftbLocale toolbar locale.
 */
function verifyUrlParameters(urlPart, query, ftbLocale) {
  var urlParts = urlPart.split('&'); // e.g. here urlParts[0] is "hl=en".
  var gtbUtils = collector.getModule('GtbUtilsAPI');

  // Expected values for parameters.
  var expectedParameterMap = {};
  expectedParameterMap[Q_PARAM_NAME] = query;
  expectedParameterMap[SOURCEID_PARAM_NAME] = SOURCE_ID;
  expectedParameterMap[RLZ_PARAM_NAME] = gtbUtils.getRlz();
  expectedParameterMap[IE_PARAM_NAME] = CHAR_CODE;

  // Actual Values of Parameters found in url.
  var actualParameterMap = {};
  for (var i = 0; i < urlParts.length; i++) {
    var parameterStringOfUrl = urlParts[i].split('=');
    if (parameterStringOfUrl[0] in actualParameterMap) {
      // If same parameter is present in urlParts more than once then it is
      // duplicate.
      jumlib.fail(parameterStringOfUrl[0] + ' parameter is duplicate');
    } else {
      actualParameterMap[parameterStringOfUrl[0]] = parameterStringOfUrl[1];
    }
  }

  // Checks if all the key-value pairs in expectedParameterMap are present in
  // actualParameterMap or not.
  function checkIfMapsAreSame(expectedParameterMap, actualParameterMap) {
    for (var paramKey in expectedParameterMap) {
      if (paramKey in actualParameterMap) {
        jumlib.assertEquals(expectedParameterMap[paramKey],
                            actualParameterMap[paramKey],
                            paramKey + ' Parameter value is not correct');
      } else {
        jumlib.fail(paramKey + ' parameter is not present');
      }
    }
  }
  checkIfMapsAreSame(expectedParameterMap, actualParameterMap);
}
