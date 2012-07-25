/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

function setupModule(module) {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller)
}

function teardownModule() {  
  delete persisted.theme;  

  addons.resetDiscoveryPaneURL();
  addonsManager.close();
}

/**
 * Test that a theme has been uninstalled
 */
function testThemeIsUninstalled() {
  addonsManager.open();

  var theme = addonsManager.getAddons({attribute: "value", 
                                       value: persisted.theme.id});

  assert.equal(theme.length, 0, persisted.theme.id + " is uninstalled");
}
