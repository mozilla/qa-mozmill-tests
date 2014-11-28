/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var addons = require("../../../../lib/addons");
var endurance = require("../../../../lib/endurance");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");

const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";
const PREF_VALUE = "addons://list/extension";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  addons.setDiscoveryPaneURL("about:home");

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();

  prefs.setPref(PREF_LAST_CATEGORY, PREF_VALUE);
}

function teardownModule() {
  addons.resetDiscoveryPaneURL();

  // Make Add-ons Manager forget last visited category
  prefs.clearUserPref(PREF_LAST_CATEGORY);
}

function testOpenAndCloseExtensionList() {
  enduranceManager.run(function () {
    // Open Add-ons Manager
    addonsManager.open();
    enduranceManager.addCheckpoint("Extensions list opened");

    // Close Add-ons Manager
    addonsManager.close();
    enduranceManager.addCheckpoint("Extensions list closed");
  });
}
