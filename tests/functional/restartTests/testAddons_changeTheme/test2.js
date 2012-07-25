/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var tabs = require("../../../../lib/tabs");

const TIMEOUT_USER_SHUTDOWN = 2000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
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

  // Restart the browser using restart prompt
  var restartLink = addonsManager.getElement({type: "listView_restartLink", 
                                              parent: defaultTheme});

  controller.startUserShutdown(TIMEOUT_USER_SHUTDOWN, true);
  controller.click(restartLink); 
}
