/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var {expect} = require("../../../lib/assertions");
var privateBrowsing = require("../../../lib/private-browsing");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  tabBrowser = new tabs.tabBrowser(controller);

  // Create Private Browsing instance and set handler
  pb = new privateBrowsing.privateBrowsing(controller);
}

var teardownModule = function(module) {
  pb.reset();
}

/**
 * Verify "Import" is disabled during Private Browsing mode
 */
var testCheckAboutPrivateBrowsing = function() {
  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  pb.start();

  // Check the disabled "Import" menu entry in the Library
  var libraryItem = new elementslib.ID(controller.window.document, "bookmarksShowAll");
  controller.click(libraryItem);
  utils.handleWindow("type", "Places:Organizer", checkImportMenu);
}

/**
 * Check that "Import from Another Browser" is disabled
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function checkImportMenu(controller) {
  var maintenanceButton = new elementslib.ID(controller.window.document,
                                             "maintenanceButton");
  controller.click(maintenanceButton);

  var importEntry = new elementslib.ID(controller.window.document, "browserImport");
  expect.ok(importEntry.getNode().disabled, "Import Menu entry is disabled");

  var cmdKey = utils.getEntity(tabBrowser.getDtds(), "closeCmd.key");
  controller.keypress(null, cmdKey, {accelKey: true});
}

/**
 * Map test functions to litmus tests
 */
// testCheckAboutPrivateBrowsing.meta = {litmusids : [9242]};
