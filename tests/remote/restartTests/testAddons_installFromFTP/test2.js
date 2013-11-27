/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var addons = require("../../../../lib/addons");
var {assert} = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';
const PREF_LAST_CATEGORY = "extensions.ui.lastCategory";

function setupModule() {
  controller = mozmill.getBrowserController();

  addonsManager = new addons.AddonsManager(controller);
  addons.setDiscoveryPaneURL(LOCAL_TEST_PAGE);

  tabs.closeAllTabs(controller);
}

function teardownModule() {
  prefs.preferences.clearUserPref(PREF_LAST_CATEGORY);

  addons.resetDiscoveryPaneURL();
  addonsManager.close();

  // Bug 886811
  // Mozmill 1.5 does not have the stopApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("stopApplication" in controller) {
    controller.stopApplication(true);
  }
}

/*
 * Verifies the extension is installed
 */
function testAddonInstalled() {
  // Verify the extension is installed
  addonsManager.open();
  addonsManager.setCategory({
    category: addonsManager.getCategoryById({id: "extension"})
  });

  var addon = addonsManager.getAddons({attribute: "value",
                                       value: persisted.addon.id})[0];

  assert.ok(addonsManager.isAddonInstalled({addon: addon}),
            "Extension '" + persisted.addon.id +
            "' has been correctly installed");
}