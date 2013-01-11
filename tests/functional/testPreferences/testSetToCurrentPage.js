/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { assert } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

const BROWSER_HOMEPAGE = "browser.startup.homepage";

function setupModule() {
  controller = mozmill.getBrowserController();

  tabs.closeAllTabs(controller);
}

function teardownModule(module) {
  prefs.preferences.clearUserPref(BROWSER_HOMEPAGE);
}

/**
 * Set homepage to current page
 */
function testSetHomePage() {
  // Go to the local page and verify the correct page has loaded
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var link = new elementslib.Link(controller.tabs.activeTab, "Community");
  assert.ok(link.exists(), "'Community' link has been found");

  // Call Prefs Dialog and set Home Page
  prefs.openPreferencesDialog(controller, prefDialogHomePageCallback);

  tabs.closeAllTabs(controller);

  // Go to the saved home page and verify it's the correct page
  var homeButton = new elementslib.ID(controller.window.document, "home-button");
  controller.click(homeButton);
  controller.waitForPageLoad();

  // Verify location bar with the saved home page
  utils.assertLoadedUrlEqual(controller, LOCAL_TEST_PAGE);
}

/**
 * Set the current page as home page
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function prefDialogHomePageCallback(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneMain';

  // Set Home Page to the current page
  var useCurrent = new elementslib.ID(controller.window.document, "useCurrent");
  controller.click(useCurrent);

  prefDialog.close(true);
}

