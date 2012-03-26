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
  addonsManager.close();
}

/*
 * Verifies the extension is installed
 */
function testAddonInstalled() {
  // Verify the extension is installed
  addonsManager.open();
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  var addon = addonsManager.getAddons({attribute: "value", 
                                       value: persisted.addon.id})[0];

  assert.ok(addonsManager.isAddonInstalled({addon: addon}), 
            "Extension '" + persisted.addon.id + 
            "' has been correctly installed");
}

// Bug 709932 - Failure in Restart Tests :: testAddons_installFromFTP
setupModule.__force_skip__ = "Bug 709932 - Failure in Restart Tests :: " + 
                             "testAddons_installFromFTP";
teardownModule.__force_skip__ = "Bug 709932 - Failure in Restart Tests :: " + 
                                "testAddons_installFromFTP";
