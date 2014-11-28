/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "geolocation/position.html";

const DTDS = ["chrome://global/locale/notification.dtd"];

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
 * Bug 1008919
 * Add test to verify geolocation sharing option "Not now"
 */
function testNotNowShareLocation() {
  persisted.nextTest = "testNotNowShareLocationPersisted";

  // Wait for the geo notification to be opened
  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    controller.open(TEST_DATA);
    controller.waitForPageLoad();
  }, {type: "notification"});

  checkGeoNotificationOpen();

  // Click on the 'Not Now' option from the menu
  // and wait for the geo notification to unload
  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    var locationLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                          "geolocation.shareLocation");
    var shareLocationButton = locationBar.getNotificationElement("geolocation-notification",
                                                                 {type: "label",
                                                                  value: locationLabel});
    var menupopup = locationBar.getElement({type: "notificationPopup_buttonMenu",
                                            parent: shareLocationButton});

    var notNowLabel = utils.getEntity(DTDS, "closeNotificationItem.label");

    var notNowAllowMenuItem = locationBar.getElement({type: "notificationPopup_menuItem",
                                                      value: notNowLabel,
                                                      parent: menupopup});

    // Click on the small arrow from the left of the 'Share Location' button
    // to open the menu popup so we can click on 'Not Now' option
    shareLocationButton.click(shareLocationButton.getNode().clientWidth - 2);
    notNowAllowMenuItem.click();
  }, {type: "notification", open: false});

  // Notification popup should appear on reloading the page
  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    locationBar.reload();
  }, {type: "notification"});

  checkGeoNotificationOpen();
}

/**
 * After browser restart no location data settings should be saved
 */
function testNotNowShareLocationPersisted() {
  // Notification panel should appear
  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    controller.open(TEST_DATA);
    controller.waitForPageLoad();
  }, {type: "notification"});

  checkGeoNotificationOpen();
}

/**
 * Check that the geo notification is open
 */
function checkGeoNotificationOpen() {
  // Check the icon inside the popup notification exists
  var notification = locationBar.getElement({type: "notification_element",
                                             subtype: "geolocation-notification",
                                             parent: locationBar.getNotification()});
  expect.ok(notification, "The geolocation notification is open");
}
