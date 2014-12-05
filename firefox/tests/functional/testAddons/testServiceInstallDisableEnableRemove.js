/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var addons = require("../../../../lib/addons");
var browser = require("../../../lib/ui/browser");
var utils = require("../../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = {
  "url" : BASE_URL + "services/install.html",
  "service" : "Testing Social Service"
};

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;
}

function teardownModule(aModule) {
  aModule.browserWindow.tabs.closeAllTabs();
  aModule.controller.stopApplication(true);
}

/**
 * Install the service to be tested
 */
function testInstall() {
  controller.open(TEST_DATA.url);
  controller.waitForPageLoad();

  // Click on install button and wait for notification
  var installButton = findElement.ID(controller.tabs.activeTab, "service");
  locationBar.waitForNotificationPanel(() => {
    installButton.click();
  }, {type: "notification"});

  // Click on enable button inside of notification
  var enableLabel = browserWindow.getProperty("service.install.ok.label");
  var enableButton = locationBar.getNotificationElement(
    "servicesInstall-notification", {type: "label", value: enableLabel}
  );
  locationBar.waitForNotificationPanel(() => {
    enableButton.click();
  }, {type: "notification", open: false});

  // When installing the service the sidebar should be displayed
  var sidebar = findElement.ID(controller.window.document, "social-sidebar-box");
  assert.waitFor(() => {
    return sidebar.exists() && utils.isDisplayed(controller, sidebar);
  }, "Sidebar has been displayed");
}

/**
 * Test the share-location button from sidebar
 */
function testShareLocation() {
  // Share Location
  var shareLocation = findElement.ID(controller.window.document, "shareLocation");
  assert.waitFor(() => {
    return shareLocation.exists() && utils.isDisplayed(controller, shareLocation);
  }, "Share geolocation button has been found");

  locationBar.waitForNotificationPanel(() => {
    shareLocation.click();
  }, {type: "notification"});

  var locationLabel = browserWindow.getProperty("geolocation.shareLocation");
  var shareButton = locationBar.getNotificationElement(
    "geolocation-notification", {type: "label", value: locationLabel}
  );
  locationBar.waitForNotificationPanel(() => {
    shareButton.click();
  }, {type: "notification", open: false});
}

/**
 * Test disable, enable, remove and undo actions on installed service
 */
function testDisableEnableRemoveUndo() {
  addonsManager.open();

  // Get the service pane
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "service"})
  });

  // Get the service by name
  var service = addonsManager.getAddons({attribute: "name",
                                       value: TEST_DATA.service})[0];

  // Disable the service
  addonsManager.disableAddon({addon: service});
  assert.ok(!addonsManager.isAddonEnabled({addon: service}),
            "The service is disabled");

  // Sidebar should be hidden when the service is disabled
  var sidebar = findElement.ID(controller.window.document, "social-sidebar-box");
  assert.waitFor(() => {
    return sidebar.exists() && !utils.isDisplayed(controller, sidebar);
  }, "Sidebar has been hidden.");

  // Enable the service
  addonsManager.enableAddon({addon: service});
  assert.ok(addonsManager.isAddonEnabled({addon: service}),
            "The service is enabled");

  // Remove the service
  addonsManager.removeAddon({addon: service});
  assert.equal(service.getNode().getAttribute("pending"), "uninstall",
               "Service was marked for uninstall");

  // Undo service removal
  addonsManager.undo({addon: service});
  assert.equal(service.getNode().getAttribute("pending"), "",
               "Service is no longer marked for uninstall");
}
