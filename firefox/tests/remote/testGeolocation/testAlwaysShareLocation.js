/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = {
  "url1" : BASE_URL + "geolocation/position.html",
  "url2" : "http://mozqa.com/data/firefox/geolocation/position.html",
  "locations" : BASE_URL + "geolocation/locations/mozilla_san_francisco.json"
};

const LOCATION = {
  lat: 37.789543,
  lng: -122.388813
}

const PREF_GEO_WIFI_URI = "geo.wifi.uri";

const TIMEOUT_GEOLOCATE = 30000;

function setupModule(aModule) {
  prefs.setPref(PREF_GEO_WIFI_URI, TEST_DATA["locations"]);
}

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
  prefs.clearUserPref(PREF_GEO_WIFI_URI);

  delete persisted.nextTest;

  utils.sanitize({siteSettings: true});
}

/**
 * Bug 1008913
 * Add test to verify geolocation sharing option "Always Share Location"
 */
function testAlwaysShareLocation() {
  persisted.nextTest = "testAlwaysShareLocationPersisted";

  // Wait for the geo notification to be opened
  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    controller.open(TEST_DATA["url1"]);
    controller.waitForPageLoad();
  }, {type: "notification"});

  checkGeoNotificationOpened();

  // Wait for the geo notification to unload
  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    var alwaysLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                        "geolocation.alwaysShareLocation");
    var alwaysAllowMenuItem = locationBar.getElement({parent: aPanel,
                                                      type: "notificationPopup_menuItem",
                                                      subtype: "label",
                                                      value: alwaysLabel});
    assert.ok(aPanel.getNode().getAttribute("popupid"), "geolocation",
              "Correct notification is closing");

    alwaysAllowMenuItem.click();
  }, {type: "notification", open: false});

  waitForLocationRetrieved();

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

  checkGeoNotificationOpened();
}

/**
 * Test if the always share property is persisted after a restart
 */
function testAlwaysShareLocationPersisted() {
  // No notification should appear
  assert.throws(() => {
    locationBar.waitForNotificationPanel(aPanel => {
      targetPanel = aPanel;

      controller.open(TEST_DATA["url1"]);
      controller.waitForPageLoad();
    }, {type: "notification"});
  }, errors.TimeoutError, "'Notification Popup' doesn't exist");

  waitForLocationRetrieved();
}

/**
 * Check that the geo notification is opened
 */
function checkGeoNotificationOpened() {
  // Check the icon inside the popup notification exists
  var notification = locationBar.getElement({type: "notification_element",
                                             subtype: "geolocation-notification",
                                             parent: locationBar.getNotification()});
  expect.ok(notification, "The geolocation notification is opened");
}

/**
 * Check if location data is displayed
 */
function waitForLocationRetrieved() {
  var result = findElement.ID(controller.tabs.activeTab, "result");

  expect.waitFor(() => result.getNode().textContent !== "undefined",
                 "Location data is avaible", TIMEOUT_GEOLOCATE);

  // Test if the correct coordinates are retrieved
  expect.equal(result.getNode().textContent, LOCATION.lat + " " + LOCATION.lng,
               "Correct location has been retrieved");
}
