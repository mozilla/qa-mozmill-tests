/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {expect} = require("../../../lib/assertions");
var addons = require("../../../lib/addons");
var tabs = require("../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

function setupModule() {
  controller = mozmill.getBrowserController();

  addonsManager = new addons.AddonsManager(controller);
  addons.setDiscoveryPaneURL(LOCAL_TEST_PAGE);

  tabs.closeAllTabs(controller);
}

function teardownModule() {
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
