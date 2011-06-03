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
 *   Tracy Walker <twalker@mozilla.com>
 *   Geo Mealer <gmealer@mozilla.com>
 *   Anthony Hughes <ahughes@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
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
 * ***** END LICENSE BLOCK *****/

// Include required modules
var places = require("../../../lib/places");
var prefs = require("../../../lib/prefs");
var toolbars = require("../../../lib/toolbars");

const TIMEOUT = 5000;
const PLACES_DB_TIMEOUT = 4000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  {URL: LOCAL_TEST_FOLDER + 'layout/mozilla_community.html',
   name: "community" }
];

var setupModule = function() {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);

  // Clear complete history so we don't get interference from previous entries
  places.removeAllHistory();
}

var teardownModule = function() {
  locationBar.autoCompleteResults.close(true);
}

/**
 * Check matched awesomebar items are highlighted.
 */
var testCheckItemHighlight = function() {
  // Use preferences dialog to select:
  // "When Using the location bar suggest:" History and Bookmarks
  prefs.openPreferencesDialog(controller, prefDialogSuggestsCallback);

  // Open the test page then about:blank to set up the test test environment
  controller.open(LOCAL_TEST_PAGES[0].URL);
  controller.waitForPageLoad();
  controller.open("about:blank");
  controller.waitForPageLoad();

  // Wait for 4 seconds to work around Firefox LAZY ADD of items to the DB
  controller.sleep(PLACES_DB_TIMEOUT);

  // Focus the locationbar, delete any contents there, then type in a match string
  locationBar.clear();

  // Type the page name into the location bar
  locationBar.type(LOCAL_TEST_PAGES[0].name);

  // Wait for the location bar to contain the entire test string
  controller.waitFor(function () {
    return locationBar.value === LOCAL_TEST_PAGES[0].name;
  }, "Location bar contains the entered string - got '" +
    locationBar.value + "', expected '" + LOCAL_TEST_PAGES[0].name + "'");

  // Check the autocomplete list is open
  controller.waitFor(function () {
    return locationBar.autoCompleteResults.isOpened == true;
  }, "Autocomplete popup has been opened - got '" +
    locationBar.autoCompleteResults.isOpened + "', expected 'true'");

  // Result to check for underlined text
  var richlistItem = locationBar.autoCompleteResults.getResult(0);

  checkAwesomebarResults(richlistItem, "title");
  checkAwesomebarResults(richlistItem, "url");

  locationBar.autoCompleteResults.close();
}

/**
 * Set matching of the location bar to "History and Bookmarks"
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogSuggestsCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'panePrivacy';

  var suggests = new elementslib.ID(controller.window.document, "locationBarSuggestion");
  controller.waitForElement(suggests);
  controller.select(suggests, null, null, 0);
  controller.sleep(100);

  prefDialog.close(true);
}

/**
 * Check the awesomebar results against what was typed
 *
 * @param {object} aResult
 *        A matching entry from the awesomebar
 * @param {string} aType
 *        The type of result
 */
function checkAwesomebarResults(aResult, aType) {
  // Get a list of any underlined autocomplete results
  var underlined = locationBar.autoCompleteResults.
                   getUnderlinedText(aResult, aType);

  // Check that there is only 1 entry
  controller.assert(function () { 
    return underlined.length === 1;
  }, "Only one autocompleted result is underlined - got '" + 
     underlined.length + "', expected '1'");

  // Check that the underlined URL matches the entered URL
  underlined.forEach(function (element) {
    controller.assert(function() {
      return element.toLowerCase() === LOCAL_TEST_PAGES[0].name;
    }, "Underlined " + aType + " matches entered " + aType + " - got '" +
       element.toLowerCase() + "', expected '" + LOCAL_TEST_PAGES[0].name + "'");
  });
}
