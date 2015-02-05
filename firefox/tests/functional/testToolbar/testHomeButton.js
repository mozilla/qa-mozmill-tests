/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

const PREF_BROWSER_HOMEPAGE = "browser.startup.homepage";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.browserWindow = new browser.BrowserWindow();

  prefs.setPref(PREF_BROWSER_HOMEPAGE, TEST_DATA);

  // Maximize the browser window because the home button is not
  // displayed on smaller window sizes
  aModule.browserWindow.maximize();

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_BROWSER_HOMEPAGE);

  aModule.browserWindow.restore();
}

/**
 * Test the home button
 */
function testHomeButton() {
  // Go to the saved home page and verify it's the correct page
  var homeButton = new elementslib.ID(controller.window.document, "home-button");
  controller.click(homeButton);
  controller.waitForPageLoad();

  // Verify location bar with the saved home page
  utils.assertLoadedUrlEqual(controller, TEST_DATA);
}
