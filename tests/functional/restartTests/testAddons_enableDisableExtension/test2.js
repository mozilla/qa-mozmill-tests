/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../../lib/addons");
var tabs = require("../../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

const TIMEOUT_USERSHUTDOWN = 2000;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  addons.setDiscoveryPaneURL(TEST_DATA);

  tabs.closeAllTabs(aModule.controller);
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

  // Click on the list view restart link
  var restartLink = addonsManager.getElement({type: "listView_restartLink",
                                              parent: addon});

  // User initiated restart
  controller.startUserShutdown(TIMEOUT_USERSHUTDOWN, true);

  controller.click(restartLink);
}
