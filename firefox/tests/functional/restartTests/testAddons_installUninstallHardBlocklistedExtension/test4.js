/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../../lib/assertions");
var addons = require("../../../../lib/addons");
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");

const PREF_BLOCKLIST = "extensions.blocklist.url";
const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
}

function teardownModule(aModule) {
  prefs.preferences.clearUserPref(PREF_BLOCKLIST);
  prefs.preferences.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.preferences.clearUserPref(PREF_LAST_CATEGORY);

  // Reset the blocklist
  utils.updateBlocklist();

  delete persisted.addon;

  addons.resetDiscoveryPaneURL();
  aModule.addonsManager.close();

  // Bug 886811
  // Mozmill 1.5 does not have the stopApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("stopApplication" in aModule.controller) {
    aModule.controller.stopApplication(true);
  }
}

/**
 * Test the blocklisted extension has been uninstalled
 */
function testBlocklistedExtensionUninstalled() {
  addonsManager.open();

  var addons = addonsManager.getAddons({attribute: "value",
                                        value: persisted.addon.id});

  assert.equal(addons.length, 0, "The blocklisted add-on is uninstalled");
}
