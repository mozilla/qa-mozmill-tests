/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

const TIMEOUT_USER_SHUTDOWN = 2000;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.addonsManager = new addons.AddonsManager(aModule.controller);

  tabs.closeAllTabs(aModule.controller);

  aModule.installedAddon = null;
}

function teardownModule(aModule) {
  // Bug 886811
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // startUserShutdown is broken in mozmill-2.0
  if ("restartApplication" in aModule.controller) {
    aModule.controller.restartApplication();
  }
  else {
    // Restart the browser using restart prompt
    var restartLink = aModule.addonsManager.getElement({type: "listView_restartLink",
                                                        parent: aModule.installedAddon});

    aModule.controller.startUserShutdown(TIMEOUT_USER_SHUTDOWN, true);
    aModule.controller.click(restartLink);
  }
}

/**
 * Tests for successful add-on installation and disables one add-on
 */
function testDisableExtension() {
  addonsManager.open();

  // Go to extensions pane
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  var enabledExtension = addonsManager.getAddons({attribute: "value",
                                                  value: persisted.addons[0].id})[0];
  var toDisableExtension = addonsManager.getAddons({attribute: "value",
                                                    value: persisted.addons[1].id})[0];

  // Check that the extensions were installed
  assert.ok(addonsManager.isAddonInstalled({addon: enabledExtension}),
            "Extension '" + persisted.addons[0].id + "' was installed");
  assert.ok(addonsManager.isAddonInstalled({addon: toDisableExtension}),
            "Extension '" + persisted.addons[1].id + "' was installed");

  // Disable the extension
  addonsManager.disableAddon({addon: toDisableExtension});

  // Check that the extension was marked for disable
  assert.equal(toDisableExtension.getNode().getAttribute("pending"), "disable",
               "The extension '" + persisted.addons[1].id + "' was marked for disable");

  // We need access to this addon in teardownModule
  installedAddon = toDisableExtension;
}
