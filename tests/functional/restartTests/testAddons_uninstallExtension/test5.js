/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");
 
function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
}

function teardownModule() {
  addons.resetDiscoveryPaneURL();
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
