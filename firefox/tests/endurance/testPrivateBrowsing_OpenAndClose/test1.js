/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var Endurance = require("../../../lib/endurance");
var privateBrowsing = require("../../../lib/ui/private-browsing");
var Tabs = require("../../../lib/tabs");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.enduranceManager = new Endurance.EnduranceManager(aModule.controller);
  aModule.pbWindow = new privateBrowsing.PrivateBrowsingWindow();

  aModule.tabBrowser = new Tabs.tabBrowser(aModule.controller);
  aModule.tabBrowser.closeAllTabs();
}

function teardownModule(aModule) {
  aModule.pbWindow.close(true);
  aModule.tabBrowser.closeAllTabs();
}

function testOpenAndClosePrivateBrowsingWindow() {
  enduranceManager.run(function () {
    pbWindow.open(controller);
    enduranceManager.addCheckpoint("Opened a private browsing window");
    pbWindow.close();
    enduranceManager.addCheckpoint("Closed a private browsing window");
  });
}
