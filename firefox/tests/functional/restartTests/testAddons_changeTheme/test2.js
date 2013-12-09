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
 * Verifies the theme is installed and enabled
 */
function testThemeIsInstalled() {
  addonsManager.open();

  // Verify the plain-theme is installed
  var plainTheme = addonsManager.getAddons({attribute: "value",
                                            value: persisted.theme[0].id})[0];

  assert.ok(addonsManager.isAddonInstalled({addon: plainTheme}),
            "The theme '" + persisted.theme[0].id + "' is installed");

  // Verify the plain-theme is enabled
  assert.ok(addonsManager.isAddonEnabled({addon: plainTheme}),
            "The theme '" + persisted.theme[0].id + "' is enabled");

  // Enable the default theme
  var defaultTheme = addonsManager.getAddons({attribute: "value",
                                              value: persisted.theme[1].id})[0];

  addonsManager.enableAddon({addon: defaultTheme});

  // Verify that default theme is marked to be enabled
  assert.equal(defaultTheme.getNode().getAttribute("pending"), "enable");

  // We need access to this addon in teardownModule
  installedAddon = defaultTheme;
}

setupModule.__force_skip__ = "Bug 931704 - plainTheme is undefined.";
teardownModule.__force_skip__ = "Bug 931704 - plainTheme is undefined.";
