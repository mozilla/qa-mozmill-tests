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
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Tracy Walker <twalker@mozilla.com>
 *   Geo Mealer <gmealer@mozilla.com>
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

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');
const LOCAL_PAGES = [
  LOCAL_TEST_FOLDER + 'layout/mozilla.html', 
  LOCAL_TEST_FOLDER + 'layout/mozilla_community.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_contribute.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_governance.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_grants.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_mission.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_organizations.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_projects.html',
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
 * Check Six is the maximum visible items in a match list.
 */
var testVisibleItemsMax = function() {
  // Use preferences dialog to ensure "When Using the location bar suggest:" History and Bookmarks is selected
  prefs.openPreferencesDialog(controller, prefDialogSuggestsCallback);

  // Open some local pages to set up the test environment
  for each (var page in LOCAL_PAGES) {
    locationBar.loadURL(page);
    controller.waitForPageLoad();
  }

  // Wait for 4 seconds to work around Firefox LAZY ADD of items to the DB
  controller.sleep(4000);

  var testString = 'll';

  // Focus the locationbar, delete any contents there
  locationBar.clear();

  // Use type and sleep on each letter to allow the autocomplete to populate with results.
  for each (var letter in testString) {
    locationBar.type(letter);
    controller.sleep(100);
  }

  // Get the visible results from the autocomplete list. Verify it is six
  var autoCompleteResultsList = locationBar.autoCompleteResults.getElement({type:"results"});
  controller.waitFor(function() { 
    return autoCompleteResultsList.getNode().getNumberOfVisibleRows() == 6;
  }, "Number of visible rows returned should equal 6");

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
