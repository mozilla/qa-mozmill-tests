/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert, expect } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = [
  BASE_URL + "layout/mozilla.html",
  BASE_URL + "layout/mozilla_mission.html"
];

var setupModule = function (aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  tabs.closeAllTabs(aModule.controller);
}

/**
 * Test clicking location bar, typing a URL and clicking the GO button
 */
var testAddressFieldAndGoButton = function () {
  var goButton = locationBar.getElement({type: "goButton"});

  // Start from a local page
  controller.open(TEST_DATA[0]);
  controller.waitForPageLoad();

  expect.ok(!utils.isDisplayed(controller, goButton), "Go button is hidden");

  // Focus and type a URL; a second local page into the location bar
  locationBar.focus({type: "shortcut"});
  locationBar.type(TEST_DATA[1]);
  assert.waitFor(function () {
    return locationBar.value === TEST_DATA[1];
  }, "Location bar contains the typed data - expected '" + TEST_DATA[1] + "'");

  assert.ok(utils.isDisplayed(controller, goButton), "Go button is visible");

  // Click the GO button
  controller.click(goButton);
  controller.waitForPageLoad();

  expect.equal(controller.tabs.length, 1, "URL opened in current tab.");
  expect.ok(!utils.isDisplayed(controller, goButton), "Go button is hidden");

  // Check if an element with an id of 'organization' exists
  var pageElement = new elementslib.ID(controller.tabs.activeTab, "organization");
  assert.ok(pageElement.exists(), "'Organization' element has been found");

  // Check if the URL bar matches the expected domain name
  utils.assertLoadedUrlEqual(controller, TEST_DATA[1]);
}
