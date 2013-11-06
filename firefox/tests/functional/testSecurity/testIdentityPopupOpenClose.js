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
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  tabs.closeAllTabs(aModule.controller);
}

/**
 * Test that the identity popup can be opened and closed
 */
var testIdentityPopupOpenClose = function() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Click the identity box
  var identityBox = new elementslib.ID(controller.window.document, "identity-box");
  controller.click(identityBox);

  // Check the popup state
  var popup = new elementslib.ID(controller.window.document, "identity-popup");
  assert.waitFor(function () {
    return popup.getNode().state === 'open';
  }, "Identity popup has been opened");

  var button = new elementslib.ID(controller.window.document,
                                  "identity-popup-more-info-button");
  expect.ok(utils.isDisplayed(controller, button),
            "More Information button is visible");

  // Press Escape to close the popup
  controller.keypress(popup, 'VK_ESCAPE', {});

  // Check the popup state again
  assert.waitFor(function () {
    return popup.getNode().state === 'closed';
  }, "Identity popup has been closed");
}

