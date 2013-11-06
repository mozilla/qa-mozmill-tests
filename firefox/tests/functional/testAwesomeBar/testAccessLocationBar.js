/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var places = require("../../../../lib/places");
var toolbars = require("../../../lib/toolbars");

const BASE_URL = collector.addHttpResource('../../../../data/');
const TEST_DATA = [
  BASE_URL + 'layout/mozilla_projects.html',
  BASE_URL + 'layout/mozilla.html',
  BASE_URL + 'layout/mozilla_mission.html',
  'about:blank'
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.locationBar = new toolbars.locationBar(aModule.controller);

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
  // Open a few different sites to create a small history
  // NOTE: about:blank doesn't appear in history and clears the page
  //       for clean test arena
  TEST_DATA.forEach(function (aPage) {
    locationBar.loadURL(aPage);
    controller.waitForPageLoad();
  });

  // Wait about 4s so the history gets populated
  controller.sleep(4000);

  // First - Focus the locationbar then delete any contents there
  locationBar.clear();

  // Second - Arrow down to open the autocomplete list, displaying
  // the most recent visit first, then arrow down again to the first entry,
  // in this case mozilla_projects.html
  controller.keypress(locationBar.urlbar, "VK_DOWN", {});
  assert.waitFor(function () {
    return locationBar.autoCompleteResults.isOpened;
  }, "Autocomplete results should be visible");

  controller.keypress(locationBar.urlbar, "VK_DOWN", {});
  assert.waitFor(function () {
    return locationBar.autoCompleteResults.selectedIndex === 0;
  }, "The first item in the drop down list should be selected");

  locationBar.contains("mission");
  controller.keypress(null, "VK_RETURN", {});
  controller.waitForPageLoad();

  // Finally - Check that the mozilla page was loaded by verifying the
  // Mozilla logo exists
  var mozillaLogo = new elementslib.ID(controller.tabs.activeTab, "mozilla_logo");
  controller.waitForElement(mozillaLogo);

  // Check that the URL in the awesomebar matches the last TEST_DATA URL
  locationBar.contains(TEST_DATA[2]);
}
