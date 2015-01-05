/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Litmus Test 8579: Display and close Larry
 */

"use strict";

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;
  aModule.identityPopup = aModule.locationBar.identityPopup;

  aModule.targetPanel = null;

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  if (aModule.targetPanel) {
    aModule.targetPanel.getNode().hidePopup();
  }
}

/**
 * Test that the identity popup can be opened and closed
 */
function testIdentityPopupOpenClose() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    var identityBox = identityPopup.getElement({type: "box"});
    identityBox.click();
  }, {type: "identity"});

  var moreInfo = identityPopup.getElement({type: "moreInfoButton"});
  expect.ok(utils.isDisplayed(controller, moreInfo),
            "More Information button is visible");

  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    aPanel.keypress("VK_ESCAPE", {});
  }, {type: "identity", open: false});
}
