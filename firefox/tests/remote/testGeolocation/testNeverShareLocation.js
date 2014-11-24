/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = {
  "url1" : BASE_URL + "geolocation/position.html",
  "url2" : "http://mozqa.com/data/firefox/geolocation/position.html"
};

function setupTest(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();
  aModule.targetPanel = null;

  persisted.nextTest = null;
}

function teardownTest(aModule) {
  if (aModule.targetPanel) {
    aModule.targetPanel.getNode().hidePopup();
  }

  if (persisted.nextTest) {
    controller.restartApplication(persisted.nextTest);
  }
}

function teardownModule(aModule) {
  aModule.tabBrowser.closeAllTabs();

  delete persisted.nextTest;

  utils.sanitize({siteSettings: true});
}

/**
 * Bug 1008914
 * Add test to verify geolocation sharing option "Never Share Location"
 */
function testNeverShareLocation() {
  persisted.nextTest = "testNeverShareLocationPersisted";

  // Wait for the geo notification to be opened
  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    controller.open(TEST_DATA["url1"]);
    controller.waitForPageLoad();
  }, {type: "notification"});

  checkGeoNotificationOpen();

  // Click on the "Never Share Location" item from the menu
  // and wait for the geo notification to unload
  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    var neverLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                       "geolocation.neverShareLocation");
    var neverAllowMenuItem = locationBar.getElement({parent: aPanel,
                                                     type: "notificationPopup_menuItem",
                                                     subtype: "label",
                                                     value: neverLabel});
    assert.ok(aPanel.getNode().getAttribute("popupid"), "geolocation",
              "Correct notification is closing");

    neverAllowMenuItem.click();
  }, {type: "notification", open: false});

  checkLocationDataRequestDenied();

  // No notification popup should appear on reloading the page
  assert.throws(() => {
    locationBar.waitForNotificationPanel(aPanel => {
      targetPanel = aPanel;

      locationBar.reload();
    }, {type: "notification"});
  }, errors.TimeoutError, "'Notification Popup' doesn't exist");

  // With another geolocation service the notification popup should appear
  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    controller.open(TEST_DATA["url2"]);
    controller.waitForPageLoad();
  }, {type: "notification"});

  checkGeoNotificationOpen();
}

/**
 * Test if the never share property is persisted after a restart
 */
function testNeverShareLocationPersisted() {
  // No notification should appear
  assert.throws(() => {
    locationBar.waitForNotificationPanel(aPanel => {
      targetPanel = aPanel;

      controller.open(TEST_DATA["url1"]);
      controller.waitForPageLoad();
    }, {type: "notification"});
  }, errors.TimeoutError, "'Notification Popup' doesn't exist");

  checkLocationDataRequestDenied();
}

/**
 * Check that the geo notification is open
 */
function checkGeoNotificationOpen() {
  // Check the icon inside the popup notification exist
  var notification = locationBar.getElement({type: "notification_element",
                                             subtype: "geolocation-notification",
                                             parent: locationBar.getNotification()});
  expect.ok(notification, "The geolocation notification is open");
}

/**
 * Check the location is not retrieved and returns specific 'denied' error code
 */
function checkLocationDataRequestDenied() {
  // Check if the location is not displayed
  var result = findElement.ID(controller.tabs.activeTab, "result");
  expect.waitFor(() => (result.getNode().textContent === "denied"),
                 "User denied the request for Geolocation");
}
