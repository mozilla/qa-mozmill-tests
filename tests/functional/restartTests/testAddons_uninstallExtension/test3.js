/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

const TIMEOUT_USER_SHUTDOWN = 2000;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  // Bug 867217
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("restartApplication" in aModule.controller) {
    // Bug 783484
    // Since the last 2 tests of this suite are skipped we reset the profile here
    // Remove these once test3 and test4 are reenabled
    aModule.controller.restartApplication(null, true);
  }
}

function teardownModule() {
  // Bug 867217
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("restartApplication" in controller) {
    // Bug 783484
    // Since the last 2 tests of this suite are skipped we reset the profile here
    // Remove these once test3 and test4 are reenabled
    controller.restartApplication(null, true);
  }
}

/**
 * Test for uninstalling a disabled add-on
 */
function testUninstallDisabledExtension() {
  addonsManager.open();

  // Check that the extension was disabled
  var disabledExtension = addonsManager.getAddons({attribute: "value",
                                                   value: persisted.addons[1].id})[0];

  assert.ok(!addonsManager.isAddonEnabled({addon: disabledExtension}),
            "Extension '" + persisted.addons[1].id + "' is disabled");

  // Remove the disabled extension
  addonsManager.removeAddon({addon: disabledExtension});

  // Switch categories to dispose of the undo link
  // Set category to 'Appearance'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "theme"})
  });

  // Switch back to 'Extensions'
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  // Check that the disabled extension was uninstalled
  var addonIdList = addonsManager.getAddons({attribute: "value",
                                             value: persisted.addons[1].id});

  assert.equal(addonIdList.length, 0,
               "Extension '" + persisted.addons[1].id +
               "' has been uninstalled");
}
