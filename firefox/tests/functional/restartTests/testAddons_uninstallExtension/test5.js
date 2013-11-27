/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  prefs.preferences.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.preferences.clearUserPref(PREF_LAST_CATEGORY);

  delete persisted.addons;

  addons.resetDiscoveryPaneURL();

  // Bug 886811
  // Mozmill 1.5 does not have the stopApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("stopApplication" in aModule.controller) {
    aModule.controller.stopApplication(true);
  }
}

/**
 * Verifies enabled add-on was uninstalled
 */
function testEnabledExtensionIsUninstalled() {
  addonsManager.open();

  // Check that the enabled extension was uninstalled
  var extensionIdList = addonsManager.getAddons({attribute: "value",
                                                 value: persisted.addons[0].id});

  assert.equal(extensionIdList.length, 0,
               "Extension '" + persisted.addons[0].id +
               "' has been uninstalled");
}

setupModule.__force_skip__ = "Bug 783484 -  Test failure 'Shutdown expected " +
                             "but none detected before end of test";
teardownModule.__force_skip__ = "Bug 783484 -  Test failure 'Shutdown expected " +
                                "but none detected before end of test";
