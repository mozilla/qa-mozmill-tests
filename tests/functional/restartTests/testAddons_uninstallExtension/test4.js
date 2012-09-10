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
 * Test uninstalling an enabled extension
 */
function testUninstallEnabledExtension() {
  addonsManager.open();

  // Remove the enabled extension
  var enabledExtension = addonsManager.getAddons({attribute: "value",
                                                  value: persisted.addons[0].id})[0];

  addonsManager.removeAddon({addon: enabledExtension});

  // Check that the enabled extension was marked for removal
  assert.equal(enabledExtension.getNode().getAttribute("pending"), "uninstall",
               "Extension '" + persisted.addons[0].id +
               "' was marked for uninstall");

  // Restart the browser using restart prompt
  var restartLink = addonsManager.getElement({type: "listView_restartLink",
                                              parent: enabledExtension});

  controller.startUserShutdown(TIMEOUT_USER_SHUTDOWN, true);
  controller.click(restartLink);
}
