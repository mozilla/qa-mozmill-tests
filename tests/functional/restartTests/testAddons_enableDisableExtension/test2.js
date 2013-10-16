/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var tabs = require("../../../../lib/tabs");

const TIMEOUT_USERSHUTDOWN = 2000;

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
    // Click on the list view restart link
    var restartLink = aModule.addonsManager.getElement({type: "listView_restartLink",
                                                        parent: aModule.installedAddon});

    // User initiated restart
    aModule.controller.startUserShutdown(TIMEOUT_USERSHUTDOWN, true);
    aModule.controller.click(restartLink);
  }
}

/**
* Test disable an extension
*/
function testDisableExtension() {
  addonsManager.open();

  // Get the extensions pane
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  // Get the addon by name
  var addon = addonsManager.getAddons({attribute: "value",
                                       value: persisted.addon.id})[0];

  // Disable the addon
  addonsManager.disableAddon({addon: addon});

  // We need access to this addon in teardownModule
  installedAddon = addon;
}
