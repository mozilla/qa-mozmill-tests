/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

const TIMEOUT_USERSHUTDOWN = 2000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
}

function teardownModule() {
  delete persisted.addon;

  addonsManager.close();
}

/**
* Check if the add-on is enabled
*/
function testEnabledAddon() {
  addonsManager.open();

  // Get the addon by name 
  var addon = addonsManager.getAddons({attribute: "value", 
                                       value: persisted.addon.id})[0];

  // Check if the addon is enabled
  assert.ok(addonsManager.isAddonEnabled({addon: addon}), "The addon is enabled");   
}

// Bug 688375 - Test failure "Add-on not specified" in testAddons_enableDisableExtension
setupModule.__force_skip__ = "Bug 688375 - Test failure 'Add-on not " +
                             "specified' in testAddons_enableDisableExtension";
teardownModule.__force_skip__ = "Bug 688375 - Test failure 'Add-on not " +
                                "specified' in testAddons_enableDisableExtension";
