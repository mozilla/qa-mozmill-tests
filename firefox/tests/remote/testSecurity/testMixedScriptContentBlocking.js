/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const TEST_DATA = {
  url: "https://mozqa.com/data/firefox/security/mixed_content_blocked/index.html",
  tests: [{
    id: "result1",
    description: "Insecure script one"
  }, {
    id: "result2",
    description: "Insecure script from iFrame"
  }, {
    id: "result3",
    description: "Insecure plugin"
  }, {
    id: "result4",
    description: "Insecure stylesheet"
  }]
};

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  aModule.targetPanel = null;

  aModule.browserWindow.tabs.closeAllTabs();
}

function teardownModule(aModule) {
  if (aModule.targetPanel) {
    aModule.targetPanel.getNode().hidePopup();
  }
}

/**
 * Test warning about viewing a mixed content page
 */
function testMixedContentPage() {
  controller.open(TEST_DATA.url);
  controller.waitForPageLoad();

  checkProtectionEnabled(true);

  // Open 'Bad Content Notification'
  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;
    var popupBox = locationBar.getElement({type: "notification_element",
                                           subtype: "notification-popup-box"});
    popupBox.click();
  }, {type: "notification"});

  // Disable the protection
  locationBar.waitForNotificationPanel(() => {
    var buttonLabel = browserWindow.getEntity("mixedContentBlocked2.options");
    var optionsButton = locationBar.getNotificationElement(
      "bad-content-notification",  {type: "label", value: buttonLabel}
    );
    optionsButton.click();

    var itemLabel = browserWindow.getEntity("mixedContentBlocked2.unblock.label");
    var menuItem = locationBar.getNotificationElement(
      "bad-content-notification",
      {type: "label", value: itemLabel}
    );
    menuItem.click();
  }, {type: "notification", open: false});

  checkProtectionEnabled(false);

  // After a reload, the scripts should still load
  locationBar.reload();
  controller.waitForPageLoad();

  checkProtectionEnabled(false);
}

/**
 * Check whether the mixed content script protection is enabled or not
 *
 * @param {boolean} aState
 *        Expected state of the protection
 */
function checkProtectionEnabled(aState) {
  var color =  (aState) ? "rgb(0, 136, 0)" : "rgb(255, 0, 0)";
  var iconParts = (aState) ? "identity-icons-https.png"
                           : "identity-icons-https-mixed-active.png";
  var state = (aState) ? "blocked" : "unblocked";

  // Check for the shield icon
  var badContentIcon = locationBar.getElement({type: "notificationIcon",
                                               subtype: "bad-content-" + state});
  assert.waitFor(() => utils.isDisplayed(controller, badContentIcon),
                 "The shield notification icon has been displayed.");

  // Check the identity icon
  var favicon = locationBar.getElement({type: "favicon"});
  assert.waitFor(() => {
    var faviconImage = utils.getElementStyle(favicon, "list-style-image");

    return faviconImage.indexOf(iconParts) !== -1;
  }, "The correct identity icon is displayed.");

  // Check the color of the page elements, the color depends on whether the
  // scripts are blocked or not
  TEST_DATA.tests.forEach((aTest) => {
    var element = findElement.ID(controller.tabs.activeTab, aTest.id);
    assert.waitFor(() => utils.getElementStyle(element, "color") === color,
                   aTest.description + " has been " + state + ".");
  });
}
