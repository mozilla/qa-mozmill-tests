/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { assert } = require("../../../../lib/assertions");
var addons = require("../../../../lib/addons");
var places = require("../../../../lib/places");
var tabs = require("../../../lib/tabs");
var windows = require("../../../../lib/windows");

var browser = require("../../../lib/ui/browser");

const TEST_DATA = "http://mozqa.com/data/firefox/plugins/flash/cookies/" +
                  "flash_cookie.html";

const COOKIE_VALUE = "cookieValue";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.browserWindow = new browser.BrowserWindow();

  // Skip test if we don't have Flash plugin enabled
  var isFlashActive = addons.getInstalledAddons(function (aAddon) {
    if (aAddon.isActive && aAddon.type === "plugin" && aAddon.name === "Shockwave Flash")
      return true;
  });

  if (!isFlashActive[0]) {
    testCheckFlashCookie.__force_skip__ = "No enabled Flash plugin detected";
    teardownModule.__force_skip__ = "No enabled Flash plugin detected";
  }

  places.clearPluginData();
  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  windows.closeAllWindows(aModule.browserWindow);
  places.clearPluginData();
}

/**
 * Verify that the Flash cookie is not visible
 * if it was saved in Private Brosing mode
 */
function testCheckFlashCookie() {
  var pbWindow = browserWindow.open({private: true});

  pbWindow.controller.open(TEST_DATA);
  pbWindow.controller.waitForPageLoad();

  // Wait for the getCookie() function to type undefined in the #result_get field
  var resultFieldPB = new elementslib.ID(pbWindow.controller.tabs.activeTab, "result_get");
  assert.waitFor(() => resultFieldPB.getNode().value === "undefined",
                 "Cookie value is undefined in private mode");

  // Enter an unique value for the cookie
  var cookieField = new elementslib.ID(pbWindow.controller.tabs.activeTab, "cookieValue");
  pbWindow.controller.type(cookieField, COOKIE_VALUE);

  // Set the cookie value
  var setCookie = new elementslib.ID(pbWindow.controller.tabs.activeTab, "setCookie");
  controller.click(setCookie);

  // Verify the cookie value was set properly
  assert.equal(resultFieldPB.getNode().value, COOKIE_VALUE,
               "Cookie value is displayed in private mode");

  // Open page in normal mode
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the cookie value
  var getCookie = new elementslib.ID(controller.tabs.activeTab, "getCookie");
  controller.click(getCookie);

  // Verify the cookie value is undefined
  var resultField = new elementslib.ID(controller.tabs.activeTab, "result_get");
  assert.notEqual(resultField.getNode().value, COOKIE_VALUE,
                  "Cookie value is not displayed in normal mode");

  // Reset the cookie value
  var clearCookie = new elementslib.ID(pbWindow.controller.tabs.activeTab, "clearCookie");
  pbWindow.controller.click(clearCookie);
  assert.equal(resultFieldPB.getNode().value, "undefined", "Flash cookie was cleared");
}
