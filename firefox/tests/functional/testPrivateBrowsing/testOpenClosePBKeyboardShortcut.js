/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { expect } = require("../../../../lib/assertions");
var utils = require("../../../../lib/utils");
var windows = require("../../../../lib/windows");

var browser = require("../../../lib/ui/browser");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.browserWindow = new browser.BrowserWindow();
}

function teardownModule(aModule) {
  windows.closeAllWindows(aModule.browserWindow);
}

/**
 * Open and close Private Browsing Mode through Keyboard shortcut
 */
function testOpenClosePBKeyboardShortcut() {
  var pbWindow = browserWindow.open({private: true, method: "shortcut"});
  expect.equal(pbWindow.controller.tabs.length, 1, "Only one tab is open");

  // Check descriptions on the about:privatebrowsing page
  var description = pbWindow.getEntity("aboutPrivateBrowsing.description");
  var learnMore = pbWindow.getEntity("aboutPrivateBrowsing.moreInfo");
  var longDescElem = findElement.Selector(pbWindow.controller.tabs.activeTab, "p.showNormal + p");
  var moreInfoElem = findElement.Selector(pbWindow.controller.tabs.activeTab, "div.showPrivate p:first-child");

  // Stop Private Browsing mode
  pbWindow.controller.waitForElement(longDescElem);
  pbWindow.controller.assertText(longDescElem, description);
  pbWindow.controller.assertText(moreInfoElem, learnMore);
  pbWindow.close();
}
