/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert, expect } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "geolocation/position.html";

const TIMEOUT_POSITION = 30000;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.locationBar = new toolbars.locationBar(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();
}

function teardownModule(aModule) {
  aModule.tabBrowser.closeAllTabs();
}

/**
 * Test displaying geolocation notification
 */
function testVerifyDisplayGeolocationNotification() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Wait for the notification to be opened and check it's icon in the location bar
  locationBar.waitForNotification("notification_popup", true, "geo");

  // Check the icon inside the popup notification exists
  var icon = locationBar.getNotificationElement("geolocation-notification",
                                                {type: "popupid", value: "geolocation"});
  expect.ok(icon, "The geolocation icon appears in the notification popup");

  // Check if a Share Location button is visible
  var locationLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                        "geolocation.shareLocation");
  var button = locationBar.getNotificationElement("geolocation-notification",
                                                  {type: "label", value: locationLabel});
  expect.ok(button, "'Share location' button appears in the notification popup");

  controller.click(button);

  // Wait for the notification to unload
  locationBar.waitForNotification("notification_popup", false);

  // Check if the location is displayed
  // The position updates lazily so additional timeout is needed
  var result = new elementslib.ID(controller.tabs.activeTab, "result");
  var regExp = /\d+(\.\d*)?\.\d+/;
  try {
    assert.waitFor(function () {
      return regExp.test(result.getNode().textContent);
    }, "", TIMEOUT_POSITION);
  }
  catch (e) {
    assert.fail("Geolocation position is: " + result.getNode().textContent);
  }
}
