/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var places = require("../../../../lib/places");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource('../../../../data/');
const TEST_DATA = [
  BASE_URL + 'layout/mozilla_projects.html',
  BASE_URL + 'layout/mozilla.html',
  BASE_URL + 'layout/mozilla_mission.html',
  'about:blank'
];

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  // Clear complete history so we don't get interference from
  // previous entries
  places.removeAllHistory();
}

function teardownModule(aModule) {
  aModule.locationBar.autoCompleteResults.close(true);
}

/**
 * Check access to the location bar drop down list via autocomplete
 */
function testAccessLocationBarHistory() {
  // History visit listener
  places.waitForVisited(TEST_DATA.slice(0, -1), () => {
    // Open a few different sites to create a small history
    // NOTE: about:blank doesn't appear in history and clears the page
    //       for clean test arena
    TEST_DATA.forEach(aPage => {
      locationBar.loadURL(aPage);
      controller.waitForPageLoad();
    });
  });

  // Bug 1038614
  // Need to blur the urlbar before focusing it otherwise the Autocomplete
  // won't load
  locationBar.urlbar.getNode().blur();

  // First - Focus the locationbar then delete any contents there
  locationBar.clear();

  // Second - Arrow down to open the autocomplete list, displaying
  // the most recent visit first, then arrow down again to the first entry,
  // in this case mozilla_mission.html
  controller.keypress(locationBar.urlbar, "VK_DOWN", {});
  assert.waitFor(() => locationBar.autoCompleteResults.isOpened,
                 "Autocomplete results should be visible");

  // Wait for autocomplete list to be populated
  assert.waitFor(() => (locationBar.autoCompleteResults.length > 1),
                 "Expected to be more than one result in the autocomplete list");

  controller.keypress(locationBar.urlbar, "VK_DOWN", {});
  assert.waitFor(() => (locationBar.autoCompleteResults.selectedIndex === 0),
                 "The first item in the drop down list should be selected");

  assert.ok(locationBar.contains("mission"),
            "Mozilla mission autocomplete entry selected");
  controller.keypress(null, "VK_RETURN", {});
  controller.waitForPageLoad();

  // Finally - Check that the mozilla page was loaded by verifying the
  // Mozilla logo exists
  var mozillaLogo = new elementslib.ID(controller.tabs.activeTab, "mozilla_logo");
  controller.waitForElement(mozillaLogo);

  // Check that the URL in the awesomebar matches the last TEST_DATA URL
  // Remove the protocol from the TEST_DATA URL
  var testURL = TEST_DATA[2].replace(/.*?:\/\//g, "");
  assert.ok(locationBar.contains(testURL),
            "Location bar URL matches '" + testURL + "'");
}
