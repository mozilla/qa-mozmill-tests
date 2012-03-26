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
}

function teardownModule() {  
  delete persisted.theme;  

  addonsManager.close();
}

/**
 * Verifies the theme is installed
 */
function testThemeIsInstalled() {
  addonsManager.open();
  
  // Set category to 'Appearance'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "theme"})
  });

  // Verify the theme is installed
  var aTheme = addonsManager.getAddons({attribute: "value", value: persisted.theme.id})[0];
  var themeIsInstalled = addonsManager.isAddonInstalled({addon: aTheme});

  expect.ok(themeIsInstalled, "The theme is successfully installed");
}

// Bug 701893 - Failure in testAddons_installTheme/test1.js
setupModule.__force_skip__ = "Bug 701893 - Failure in " + 
                             "testAddons_installTheme/test1.js";
teardownModule.__force_skip__ = "Bug 701893 - Failure in " + 
                                "testAddons_installTheme/test1.js";
