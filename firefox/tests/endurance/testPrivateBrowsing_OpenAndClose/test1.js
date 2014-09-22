/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var Endurance = require("../../../../lib/endurance");
var Tabs = require("../../../lib/tabs");
var windows = require("../../../../lib/windows");

var browser = require("../../../lib/ui/browser");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.enduranceManager = new Endurance.EnduranceManager(aModule.controller);
  aModule.tabBrowser = new Tabs.tabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();
}

function teardownModule(aModule) {
  windows.closeAllWindows(aModule.browserWindow);
  aModule.tabBrowser.closeAllTabs();
}

function testOpenAndClosePrivateBrowsingWindow() {
  var pbWindow = null;

  enduranceManager.run(function () {
    pbWindow = browserWindow.open({private: true});
    enduranceManager.addCheckpoint("Opened a private browsing window");
    pbWindow.close();
    enduranceManager.addCheckpoint("Closed a private browsing window");
  });
}
