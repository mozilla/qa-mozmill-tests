/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var Endurance = require("../../../lib/endurance");
var privateBrowsing = require("../../../lib/ui/private-browsing");
var Tabs = require("../../../lib/tabs");

function setupModule() {
  controller = mozmill.getBrowserController();
  enduranceManager = new Endurance.EnduranceManager(controller);

  tabBrowser = new Tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();
}

function testOpenAndClosePrivateBrowsingWindow() {
  enduranceManager.run(function () {
    var pbWindow = new privateBrowsing.PrivateBrowsingWindow();
    pbWindow.open(controller);
    enduranceManager.addCheckpoint("Opened a private browsing window");
    pbWindow.close();
    enduranceManager.addCheckpoint("Closed a private browsing window");
  });
}

