/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var { assert } = require("../../../../../lib/assertions");
var utils = require("../../../../lib/utils");
var { BlocklistWindow } = require("../../../../lib/ui/addons_blocklist");

// Bug 727842
// Need to restart httpd after Firefox restarts
collector.addHttpResource("../../../../../data/");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  aModule.blocklistWindow = new BlocklistWindow(aModule.controller);
}

function teardownModule(aModule) {
  aModule.addonsManager.close();

  // Bug 867217
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("restartApplication" in aModule.controller) {
    aModule.controller.restartApplication();
  }
}

/*
 * Test that the extension is blocklisted
 */
function testBlocklistsExtension() {
  addonsManager.open();

  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  var addon = addonsManager.getAddons({attribute: "value",
                                       value: persisted.addon.id})[0];

  assert.ok(addonsManager.isAddonInstalled({addon: addon}),
            "The addon is installed");

  blocklistWindow.open();

  // Check if the add-on name is shown in the blocklist window
  var hardBlockedAddon = blocklistWindow.getElement({type: "hardBlockedAddon"});
  assert.equal(hardBlockedAddon.getNode().getAttribute("name"),
               persisted.addon.name, "The addon appears in the blocklist");
}
