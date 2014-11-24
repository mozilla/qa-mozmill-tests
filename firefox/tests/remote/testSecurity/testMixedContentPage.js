/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const TEST_DATA = "https://mozqa.com/data/firefox/security/mixedcontent.html";

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
 * Test warning about viewing a mixed content page
 */
function testMixedContentPage() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var favicon = locationBar.getElement({type: "favicon"});
  assert.waitFor(function () {
    var faviconImage = utils.getElementStyle(favicon, "list-style-image");
    return faviconImage.indexOf("identity-icons-https-mixed-display") !== -1;
  }, "There is a warning image");

  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    var identityBox = identityPopup.getElement({type: "box"});
    identityBox.click();
  }, {type: "identity"});

  var encryptionPopup = identityPopup.getElement({type: "popup"});
  var property = utils.getProperty("chrome://browser/locale/browser.properties",
                                   "identity.broken_loaded");
  assert.equal(encryptionPopup.getNode().textContent, property, "The page has mixed content");
}

