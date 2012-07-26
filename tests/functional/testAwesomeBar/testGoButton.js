/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { assert, expect } = require("../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  LOCAL_TEST_FOLDER + 'layout/mozilla.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_mission.html'
];

var setupModule = function () {
  controller = mozmill.getBrowserController();
  locationBar = new toolbars.locationBar(controller);

  tabs.closeAllTabs(controller);
}

/**
 * Test clicking location bar, typing a URL and clicking the GO button
 */
var testAddressFieldAndGoButton = function () {
  var goButton = locationBar.getElement({type: "goButton"});

  // Start from a local page
  controller.open(LOCAL_TEST_PAGES[0]);
  controller.waitForPageLoad();

  expect.ok(!utils.isDisplayed(controller, goButton), "Go button is hidden");

  // Focus and type a URL; a second local page into the location bar
  locationBar.focus({type: "shortcut"});
  locationBar.type(LOCAL_TEST_PAGES[1]);

  assert.ok(utils.isDisplayed(controller, goButton), "Go button is visible");

  // Click the GO button
  controller.click(goButton);
  controller.waitForPageLoad();

  expect.equal(controller.tabs.length, 1, "URL opened in current tab.");
  expect.ok(!utils.isDisplayed(controller, goButton), "Go button is hidden");

  // Check if an element with an id of 'organization' exists
  var pageElement = new elementslib.ID(controller.tabs.activeTab, "organization");
  controller.assertNode(pageElement);

  // Check if the URL bar matches the expected domain name
  utils.assertLoadedUrlEqual(controller, LOCAL_TEST_PAGES[1]);
}
