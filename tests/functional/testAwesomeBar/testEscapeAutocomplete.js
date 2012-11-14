/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { assert, expect } = require("../../../lib/assertions");
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
  LOCAL_TEST_PAGES.forEach(function (aPage) {
    locationBar.loadURL(aPage);
    controller.waitForPageLoad();
  });

  // Wait for 4 seconds to work around Firefox LAZY ADD of items to the DB
  controller.sleep(4000);

  // Focus the locationbar and delete any content that is there
  locationBar.clear();

  locationBar.type(TEST_STRING);
  assert.waitFor(function () {
    return locationBar.value === TEST_STRING;
  }, "Location bar contains the typed data - expected '" + TEST_STRING + "'");

  assert.waitFor(function () {
    return locationBar.autoCompleteResults.isOpened;
  }, "Autocomplete list has been opened");

  // After the first Escape press
  controller.keypress(locationBar.urlbar, 'VK_ESCAPE', {});
  expect.contain(locationBar.value, TEST_STRING,
                 "Search string found in the locationbar");
  assert.waitFor(function () {
    return !locationBar.autoCompleteResults.isOpened;
  }, "Autocomplete list has been closed");

  // After the second Escape press, confirm the locationbar returns to the current page url
  controller.keypress(locationBar.urlbar, 'VK_ESCAPE', {});
  utils.assertLoadedUrlEqual(controller, LOCAL_TEST_PAGES[1]);
}

/**
 * Map test function to litmus test
 */
// testEscape.meta = {litmusids : [8693]};
