/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var {expect} = require("../../../lib/assertions");
var addons = require("../../../lib/addons");
var tabs = require("../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.addonsManager = new addons.AddonsManager(aModule.controller);
  addons.setDiscoveryPaneURL(TEST_DATA);

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

  // Check that there are two opened tabs
  expect.equal(controller.tabs.length, 2,
               "The Add-ons Manager has been opened in a second tab");
}
