/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var {expect} = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const PREF_UPDATE_EXTENSION = "extensions.update.enabled";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  aModule.addonsManager.close();

  prefs.preferences.clearUserPref(PREF_UPDATE_EXTENSION);

  delete persisted.addons;
}

/**
 * Verifies the addons are installed
 */
function testCheckMultipleExtensionsAreInstalled() {
  addonsManager.open();
  addonsManager.setCategory({category: addonsManager.getCategoryById({id: "extension"})});

  persisted.addons.forEach(function(addon) {
    //Verify the addons are installed
    var aAddon = addonsManager.getAddons({attribute: "value", value: addon.id})[0];
    var addonIsInstalled = addonsManager.isAddonInstalled({addon: aAddon});

    expect.ok(addonIsInstalled, "Add-on has been installed");
  });
}
