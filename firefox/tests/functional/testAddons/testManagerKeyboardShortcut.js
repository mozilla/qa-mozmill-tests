/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var {expect} = require("../../../../lib/assertions");
var addons = require("../../../../lib/addons");
var tabs = require("../../../lib/tabs");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  addons.setDiscoveryPaneURL("about:home");

  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  addons.resetDiscoveryPaneURL();
  addonsManager.close();
}

/**
* Tests opening Add-ons Manager via keyboard shortcut
*/
function testKeyboardShortcut() {
  addonsManager.open({type: "shortcut"});

  expect.equal(controller.tabs.activeTab.location.toString(), "about:addons",
               "The Add-ons Manager has been opened");
}
