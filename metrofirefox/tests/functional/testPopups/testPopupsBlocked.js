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
 * Bug 883860: Test that pop-ups are blocked and no notification is shown
 * the second time we revisit the page
 */
function testPopupsBlocked() {
  toolBar.notificationBar.waitForNotification("popup-blocked", () => {
    controller.open(TEST_DATA + POPUPS_COUNT);
    controller.waitForPageLoad();
  });

  var buttonLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                      "popupButtonNeverWarn3");
  var neverWarnButton = toolBar.notificationBar.getElement({type: "button",
                                                            subtype: buttonLabel});
  neverWarnButton.tap();

  var notification = toolBar.notificationBar.getElement({type: "notification",
                                                         subtype: "popup-blocked"});

  assert.waitFor(() => !notification.exists(), "Notification has dissappeared");

  // Revisiting the page will not trigger a notification
  controller.open(TEST_DATA + POPUPS_COUNT);
  controller.waitForPageLoad();

  assert.throws(() => {
    assert.waitFor(() => notification.exists(), "");
  }, errors.TimeoutError, "Notification bar element doesn't exists");
}
