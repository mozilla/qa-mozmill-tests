/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {expect} = require("../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
}

function teardownModule() {
  addonsManager.close();

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

