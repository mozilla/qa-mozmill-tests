/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var browser = require("../ui/browser");
var baseICPage = require("../ui/base-in-content-page");
var utils = require("../../../lib/utils");

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.page = new baseICPage.BaseInContentPage(aModule.browserWindow);
  aModule.browserWindow.tabs.closeAllTabs();
}

function teardownModule(aModule) {
  aModule.browserWindow.tabs.closeAllTabs();
}

function testBaseInContentPage() {
  page.open(() => {
    var cmdKey = browserWindow.getEntity("addons.commandkey");
    browserWindow.controller.keypress(null, cmdKey, {accelKey: true, shiftKey: true});
  });

  // Close the first browser tab testing the case when only BICP tab is opened
  browserWindow.tabs.selectedIndex = 0;
  browserWindow.tabs.closeTab();

  assert.ok(page.isOpen, "Tab with the in-content page has been opened");

  page.close();
  assert.ok(!page.isOpen, "Tab with the in-content page has been closed");
}
