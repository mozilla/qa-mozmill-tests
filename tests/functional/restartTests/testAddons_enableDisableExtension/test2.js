/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var tabs = require("../../../../lib/tabs");

const TIMEOUT_USERSHUTDOWN = 2000;

function setupModule() {
  controller = mozmill.getBrowserController();
  addonsManager = new addons.AddonsManager(controller);

  tabs.closeAllTabs(controller);
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
