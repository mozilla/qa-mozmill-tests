/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var { assert } = require("../../../../lib/assertions");
var { BlocklistWindow } = require("../../../../lib/ui/addons_blocklist");

// XXX: Bug 727842 - Need to restart httpd after Firefox restarts
collector.addHttpResource("../../../../data/");

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);
  blocklistWindow = new BlocklistWindow(controller);
}

function teardownModule() {
  // Bug 867217
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("restartApplication" in controller) {
    controller.restartApplication();
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
