/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include the required modules
var tabs = require("../../../lib/ui/tabs");
var toolbars = require("../../../lib/ui/toolbars");
var utils = require("../../../../firefox/lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "popups/popup_trigger.html?count=";

const POPUPS_COUNT = 6;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.toolBar = new toolbars.ToolBar(aModule.controller);
  aModule.tabBrowser = new tabs.TabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();
  Services.perms.removeAll();
}

function teardownModule(aModule) {
  var notification = toolBar.notificationBar.getElement({type: "notification",
                                                         subtype: "popup-blocked"});
  if (notification.getNode()) {
    notification.getNode().close();
  }

  aModule.tabBrowser.closeAllTabs();
  Services.perms.removeAll();
}

/**
 * Bug 883860: Test to make sure pop-ups are allowed
 * once and blocked when revisiting the page
 */
function testAllowOnce() {
  toolBar.notificationBar.waitForNotification("popup-blocked", () => {
    controller.open(TEST_DATA + POPUPS_COUNT);
    controller.waitForPageLoad();
  });

  // Get the Allow once Button and click on it
  var buttonLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                      "popupButtonAllowOnce2");
  var allowOnceButton = toolBar.notificationBar.getElement({type: "button",
                                                            subtype: buttonLabel});
  allowOnceButton.tap();

  // Wait for the six popups to be displayed
  assert.waitFor(() => (tabBrowser.length === POPUPS_COUNT + 1),
                 (POPUPS_COUNT + 1) + " tabs have been opened.");

  // Checking the popup was allowed only once by revisiting the page
  toolBar.notificationBar.waitForNotification("popup-blocked", () => {
    controller.open(TEST_DATA + POPUPS_COUNT);
    controller.waitForPageLoad();
  });
}
