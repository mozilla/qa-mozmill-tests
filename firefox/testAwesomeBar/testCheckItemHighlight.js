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
var places = require("../../lib/places");
var prefs = require("../../lib/prefs");
var toolbars = require("../../lib/toolbars");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');
const LOCAL_TEST_PAGES = [
  LOCAL_TEST_FOLDER + 'layout/mozilla_community.html',
  'about:blank'
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
  for each (var page in LOCAL_TEST_PAGES) {
    locationBar.loadURL(page);
    controller.waitForPageLoad();
  }

  // Wait for 4 seconds to work around Firefox LAZY ADD of items to the DB
  controller.sleep(4000);

  // Focus the locationbar, delete any contents there, then type in a match string
  locationBar.clear();

  // Use type and sleep on each letter to allow the autocomplete to populate with results.
  var testString = "community";
  
  for each (var letter in testString) {
    locationBar.type(letter);
    controller.sleep(100);
  }

  // Wait for the location bar to contain the entire test string
  controller.waitFor(function () {
    return locationBar.value === testString;
  }, "Location bar contains the entered string - got " +
    locationBar.value + ", expected " + testString);

  // Check the autocomplete list is open
  controller.waitFor(function () {
    return locationBar.autoCompleteResults.isOpened == true;
  }, "Autocomplete popup has been opened - got " +
    locationBar.autoCompleteResults.isOpened + ", expected " + true);

  // Result to check for underlined text
  var richlistItem = locationBar.autoCompleteResults.getResult(0);

  // Get a list of any underlined autocomplete titles
  var titleEntries = locationBar.autoCompleteResults.
                     getUnderlinedText(richlistItem, "title");

  // Check that there is only 1 entry
  controller.assert(function () {
    return titleEntries.length === 1;
  }, "Only one underlined entry is visible - got " + titleEntries.length + 
    ", expected " + 1);

  // Check that the underlined title matches the entered title
  for each (var entry in titleEntries) {
    controller.assert(function () {
      return entry.toLowerCase() === testString;
    }, "Underlined title matches the entered title - got " + entry.toLowerCase() +
      ", expected " + testString);
  }

  // Get a list of any underlined autocomplete URLs
  var URLEntries = locationBar.autoCompleteResults.
                   getUnderlinedText(richlistItem, "url");

  // Check that there is only 1 entry
  controller.assert(function () { 
    return URLEntries.length === 1;
  }, "Only one autocompleted URL is underlined - got " + URLEntries.length +
    ", expected " + 1);

  // Check that the underlined URL matches the entered URL
  for each (var entry in URLEntries) {
    controller.assert(function () { 
      return entry.toLowerCase() === testString;
    }, "Underlined URL matches entered URL - got " + entry.toLowerCase() + 
    ", expected " + testString);
  }

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
 * Map test functions to litmus tests
 */
// testCheckItemHighlight.meta = {litmusids : [8774]};
