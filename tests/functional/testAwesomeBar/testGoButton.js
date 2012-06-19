/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  LOCAL_TEST_FOLDER + 'layout/mozilla.html',
  LOCAL_TEST_FOLDER + 'layout/mozilla_mission.html'
];

var setupModule = function() {
  controller = mozmill.getBrowserController();
  locationBar = new toolbars.locationBar(controller);

  goButton = locationBar.getElement({type: "goButton"});
}

/**
 * Test to make sure the GO button only appears while typing.
 */
var testGoButtonOnTypeOnly = function() {
  // Start from a local page
  controller.open(LOCAL_TEST_PAGES[0]);
  controller.waitForPageLoad();

  // Verify GO button is hidden
  utils.assertElementVisible(controller, goButton, false);

  // Typing a single character should show the GO button
  locationBar.focus({type: "shortcut"});
  locationBar.type("w");
  utils.assertElementVisible(controller, goButton, true);

  // Removing content and focus should hide the Go button
  locationBar.clear();
  controller.keypress(locationBar.urlbar, "VK_ESCAPE", {});
  utils.assertElementVisible(controller, goButton, false);
}

/**
 * Test clicking location bar, typing a URL and clicking the GO button
 */
var testClickLocationBarAndGo = function()
{

  // Start from a local page
  controller.open(LOCAL_TEST_PAGES[0]);
  controller.waitForPageLoad();

  // Focus and type a URL; a second local page into the location bar
  locationBar.focus({type: "shortcut"});
  locationBar.type(LOCAL_TEST_PAGES[1]);

  // Click the GO button
  controller.click(goButton);
  controller.waitForPageLoad();

  // Check if an element with an id of 'organization' exists and the Go button is hidden
  var pageElement = new elementslib.ID(controller.tabs.activeTab, "organization");
  controller.assertNode(pageElement);
  utils.assertElementVisible(controller, goButton, false);

  // Check if the URL bar matches the expected domain name
  utils.assertLoadedUrlEqual(controller, LOCAL_TEST_PAGES[1]);
}

/**
 * Map test functions to litmus tests
 */
// testClickLocationBarAndGo.meta = {litmusids : [7957]};
