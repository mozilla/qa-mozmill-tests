/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { expect } = require("../../../../lib/assertions");
var privateBrowsing = require("../../../lib/ui/private-browsing");
var utils = require("../../../lib/utils");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.pbWindow = new privateBrowsing.PrivateBrowsingWindow();
}

function teardownModule(aModule) {
  aModule.pbWindow.close(true);
}

/**
 * Open and close Private Browsing Mode through Keyboard shortcut
 */
function testOpenClosePBKeyboardShortcut() {
  pbWindow.open(controller, "shortcut");
  expect.equal(pbWindow.controller.tabs.length, 1, "Only one tab is open");

  // Check descriptions on the about:privatebrowsing page
  var description = utils.getEntity(pbWindow.getDtds(), "privatebrowsingpage.perwindow.description");
  var learnMore = utils.getEntity(pbWindow.getDtds(), "privatebrowsingpage.learnMore");
  var longDescElem = new elementslib.ID(pbWindow.controller.tabs.activeTab, "errorLongDescText");
  var moreInfoElem = new elementslib.ID(pbWindow.controller.tabs.activeTab, "moreInfoLink");

  // Stop Private Browsing mode
  pbWindow.controller.waitForElement(longDescElem);
  pbWindow.controller.assertText(longDescElem, description);
  pbWindow.controller.assertText(moreInfoElem, learnMore);
  pbWindow.close();
}
