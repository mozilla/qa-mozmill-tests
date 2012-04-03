/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var addons = require("../../../lib/addons");
var endurance = require("../../../lib/endurance");
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");

const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";
const PREF_VALUE = "addons://list/extension";

function setupModule() {
  controller = mozmill.getBrowserController();

  enduranceManager = new endurance.EnduranceManager(controller);
  addonsManager = new addons.AddonsManager(controller);
  tabBrowser = new tabs.tabBrowser(controller);  

  tabBrowser.closeAllTabs();

  prefs.preferences.setPref(PREF_LAST_CATEGORY, PREF_VALUE);
}

function teardownModule() {
  // Make Add-ons Manager forget last visited category
  prefs.preferences.clearUserPref(PREF_LAST_CATEGORY);
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
