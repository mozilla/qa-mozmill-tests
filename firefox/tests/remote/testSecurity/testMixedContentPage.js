/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const TEST_DATA = "https://mozqa.com/data/firefox/security/mixedcontent.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.locationBar = new toolbars.locationBar(aModule.controller);

  tabs.closeAllTabs(aModule.controller);
}

/**
 * Test warning about viewing a mixed content page
 */
function testMixedContentPage() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var favicon = locationBar.getElement({type:"favicon"});
  assert.waitFor(function () {
    var faviconImage = utils.getElementStyle(favicon, 'list-style-image');
    return faviconImage.indexOf("identity-icons-https-mixed-display.png") !== -1;
  }, "There is a warning image");

  controller.click(favicon);

  var encryptionPopup = locationBar.getElement({type:"identityPopup"});
  var property = utils.getProperty("chrome://browser/locale/browser.properties",
                                   "identity.mixed_display_loaded");
  assert.equal(encryptionPopup.getNode().textContent, property, "The page has mixed content");
}

