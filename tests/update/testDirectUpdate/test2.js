/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var softwareUpdate = require("../../../lib/software-update");
var utils = require("../../../lib/utils");

function setupModule(module) {
  controller = mozmill.getBrowserController();
  update = new softwareUpdate.softwareUpdate();
}

function teardownModule(module) {
  // Store the patch info from a possibly found update
  persisted.updates[persisted.updateIndex].patch = update.patchInfo;
}

/**
 * Download an update via the given update channel
 */
var testDirectUpdate_Download = function() {
  // Check if the user has permissions to run the update
  controller.assert(function() {
    return update.allowed;
  }, "User has permissions to update the build.");

  // Check the about dialog
  update.checkAboutDialog(controller);

  // Open the software update dialog and wait until the check has been finished
  update.openDialog(controller);
  update.waitForCheckFinished();

  // Download the update
  update.controller.waitFor(function() {
    return update.updatesFound;
  }, "An update has been found.");

  update.download(persisted.channel);
}
