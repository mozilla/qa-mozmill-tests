/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { assert } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

var prefWindow = require("../../../lib/ui/pref-window");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

const BROWSER_HOMEPAGE = "browser.startup.homepage";
const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  prefs.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);
  prefs.clearUserPref(BROWSER_HOMEPAGE);
}

/**
 * Set homepage to current page
 */
function testSetHomePage() {
  // Go to the local page and verify the correct page has loaded
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var link = new elementslib.Link(controller.tabs.activeTab, "Community");
  assert.ok(link.exists(), "'Community' link has been found");

  // Call Prefs Dialog and set Home Page
  prefWindow.openPreferencesDialog(controller, prefDialogHomePageCallback);

  tabs.closeAllTabs(controller);

  // Go to the saved home page and verify it's the correct page
  var homeButton = new elementslib.ID(controller.window.document, "home-button");
  controller.click(homeButton);
  controller.waitForPageLoad();

  // Verify location bar with the saved home page
  utils.assertLoadedUrlEqual(controller, TEST_DATA);
}

/**
 * Set the current page as home page
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function prefDialogHomePageCallback(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);
  prefDialog.paneId = 'paneMain';

  // Set Home Page to the current page
  var useCurrent = new elementslib.ID(aController.window.document, "useCurrent");
  aController.click(useCurrent);

  prefDialog.close(true);
}
