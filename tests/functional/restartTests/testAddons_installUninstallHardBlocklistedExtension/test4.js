/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { assert } = require("../../../../lib/assertions");
var addons = require("../../../../lib/addons");
var prefs = require("../../../../lib/prefs");

const PREF_BLOCKLIST = "extensions.blocklist.url";
const PREF_INSTALL_DIALOG = "security.dialog_enable_delay";
const PREF_UPDATE_EXTENSION = "extensions.update.enabled";

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);
}

function teardownModule() {
  prefs.preferences.clearUserPref(PREF_BLOCKLIST);
  prefs.preferences.clearUserPref(PREF_INSTALL_DIALOG);
  prefs.preferences.clearUserPref(PREF_UPDATE_EXTENSION);

  delete persisted.addon;
  addonsManager.close();
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
