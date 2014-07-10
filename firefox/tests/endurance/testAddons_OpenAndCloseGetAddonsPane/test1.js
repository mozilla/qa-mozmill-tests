/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var addons = require("../../../../lib/addons");
var endurance = require("../../../../lib/endurance");
var tabs = require("../../../lib/tabs");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  addons.setDiscoveryPaneURL("about:home");

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();
}

function teardownModule() {
  addons.resetDiscoveryPaneURL();
}

function testOpenAndCloseAddonManager() {
  enduranceManager.run(function () {
    addonsManager.open();
    enduranceManager.addCheckpoint("Add-ons Manager open");
    addonsManager.close();
    enduranceManager.addCheckpoint("Add-ons Manager closed");
  });
}
