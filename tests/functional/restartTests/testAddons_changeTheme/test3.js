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
  delete persisted.theme;  

  addonsManager.close();
  addons.resetDiscoveryPaneURL();
}

/*
 * Verify we changed to the default theme
 */
function testChangedThemeToDefault() {
  addonsManager.open();

  // Verify the default theme is active
  var defaultTheme = addonsManager.getAddons({attribute: "value", 
                                              value: persisted.theme[1].id})[0];

  assert.equal(defaultTheme.getNode().getAttribute("active"), "true");
}
