/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var places = require("../../../lib/places");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  LOCAL_TEST_FOLDER + 'layout/mozilla.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_community.html'
];

const TEST_STRING = "mozilla";

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
 * Check Escape key functionality during auto-complete process
 */
var testEscape = function() {
  // Open some local pages to set up the test environment
  for each (var localPage in LOCAL_TEST_PAGES) {
    locationBar.loadURL(localPage);
    controller.waitForPageLoad();
  }

  // Wait for 4 seconds to work around Firefox LAZY ADD of items to the DB
  controller.sleep(4000);
  
  // Focus the locationbar and delete any content that is there
  locationBar.clear();

  // Use type and sleep on each letter to allow the autocomplete to populate with results
  for (var i = 0; i < TEST_STRING.length; i++) {
    locationBar.type(TEST_STRING[i]);
    controller.sleep(100);
  }

  // Confirm that 'mozilla' is in the locationbar and the awesomecomplete list is open
  controller.assertJS("subject.contains('" + TEST_STRING + "') == true", locationBar);
  controller.assertJS("subject.autoCompleteResults.isOpened == true", locationBar);

  // After the first Escape press, confirm that 'mozilla' is in the locationbar and awesomecomplete list is closed
  controller.keypress(locationBar.urlbar, 'VK_ESCAPE', {});
  controller.assertJS("subject.contains('" + TEST_STRING + "') == true", locationBar);
  controller.assertJS("subject.autoCompleteResults.isOpened == false", locationBar);
  
  // After the second Escape press, confirm the locationbar returns to the current page url
  controller.keypress(locationBar.urlbar, 'VK_ESCAPE', {});
  utils.assertLoadedUrlEqual(controller, LOCAL_TEST_PAGES[1]);
}

/**
 * Map test function to litmus test
 */
// testEscape.meta = {litmusids : [8693]};
