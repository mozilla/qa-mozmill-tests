/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Litmus Test 8579: Display and close Larry
 */

// Include necessary modules
var { assert, expect } = require("../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla.html'},
];

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  tabs.closeAllTabs(controller);
}

/**
 * Test that the identity popup can be opened and closed
 */
var testIdentityPopupOpenClose = function() {
  controller.open(LOCAL_TEST_PAGES[0].url);
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

/**
 * Map test functions to litmus tests
 */
// testIdentityPopupOpenClose.meta = {litmusids : [8579]};
