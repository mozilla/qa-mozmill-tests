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
 * Bug 883860 : Test to make sure pop-ups are allowed second time we visit the page if
 * we had hit the Always Allow button prior to that
 */
function testAlwaysAllow() {
  toolBar.notificationBar.waitForNotification("popup-blocked", () => {
    controller.open(TEST_DATA + POPUPS_COUNT);
    controller.waitForPageLoad();
  });

  var buttonLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                      "popupButtonAlwaysAllow3");
  var alwaysAllowButton = toolBar.notificationBar.getElement({type: "button",
                                                              subtype: buttonLabel});
  alwaysAllowButton.tap();

  // Wait for the six popups to be displayed
  assert.waitFor(() => (tabBrowser.length === POPUPS_COUNT + 1),
                 (POPUPS_COUNT + 1) + " tabs have been opened.");

  tabBrowser.closeAllTabs();
  controller.open(TEST_DATA + POPUPS_COUNT);
  controller.waitForPageLoad();

  var notification = toolBar.notificationBar.getElement({type: "notification",
                                                         subtype: "popup-blocked"});
  assert.throws(() => {
    assert.waitFor(() => notification.exists(), "");
  }, errors.TimeoutError, "Notification bar element doesn't exists");

  assert.waitFor(() => (tabBrowser.length === POPUPS_COUNT + 1),
                 (POPUPS_COUNT + 1) + " tabs have been opened.");

  assert.equal(tabBrowser.selectedIndex, POPUPS_COUNT,
               "The last opened pop-up is selected");
}

setupModule.__force_skip__ = "Bug 968739 - After taping 'Always Allow' " +
                             "we should wait for 6 pop-ups to open";
teardownModule.__force_skip__ = "Bug 968739 - After taping 'Always Allow' " +
                                "we should wait for 6 pop-ups to open";
