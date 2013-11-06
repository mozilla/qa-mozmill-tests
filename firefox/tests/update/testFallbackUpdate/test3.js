/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var {assert} = require("../../../../lib/assertions");
var softwareUpdate = require("../../../lib/software-update");
var utils = require("../../../lib/utils");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.update = new softwareUpdate.softwareUpdate();

  persisted.updates[persisted.updateIndex].fallback = true;
}

function teardownModule(aModule) {
  // Store information for fallback patch
  persisted.updates[persisted.updateIndex].patch_fallback = aModule.update.patchInfo;

  // Bug 886811
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // startUserShutdown is broken in mozmill-2.0
  if ("restartApplication" in aModule.controller) {
    aModule.controller.restartApplication();
  }
}

/**
 * Test that the patch hasn't been applied and the complete patch gets downloaded
 **/
function testFallbackUpdate_ErrorPatching() {
  // The dialog should be open in the background and shows a failure
  update.waitForDialogOpen(controller);

  // Complete updates have to be handled differently
  if (persisted.updates[persisted.updateIndex].patch.is_complete) {
    // Wait for the error page and close the software update dialog
    update.waitForWizardPage(softwareUpdate.WIZARD_PAGES.errors);
    update.closeDialog();

    // Open the software update dialog again and wait until the check has been finished
    update.openDialog(controller);
    update.waitForCheckFinished();

    // Download the update
    assert.waitFor(function() {
      return update.updatesFound;
    }, "An update has been found.");

    update.download(persisted.channel);
  }
  else {
    update.waitForWizardPage(softwareUpdate.WIZARD_PAGES.errorPatching);

    // Start downloading the fallback update
    update.download(persisted.channel);
  }
}
