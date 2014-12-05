/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var prefs = require("../../../../lib/prefs");
var softwareUpdate = require("../../../lib/software-update");
var utils = require("../../../../lib/utils");


const PREF_UPDATE_LOG = "app.update.log";
const PREF_UPDATE_URL_OVERRIDE = "app.update.url.override";


function setupTest(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.update = new softwareUpdate.SoftwareUpdate();

  persisted.nextTest = null;
}

function teardownTest(aModule) {
  if (persisted.nextTest) {
    aModule.controller.restartApplication(persisted.nextTest);
  }
}

function teardownModule(aModule) {
  delete persisted.nextTest;

  // Prepare persisted object for the next update
  persisted.update.updateIndex++;

  prefs.clearUserPref(PREF_UPDATE_LOG);
  prefs.clearUserPref(PREF_UPDATE_URL_OVERRIDE);

  aModule.controller.stopApplication(true);
}

function testPrepareTest() {
  persisted.nextTest = "testCheckAndDownloadUpdate";

  softwareUpdate.initUpdateTests(true);

  // Turn on software update logging
  prefs.setPref(PREF_UPDATE_LOG, true);

  // If requested force a specific update URL
  if (persisted.update.update_url) {
    prefs.setPref(PREF_UPDATE_URL_OVERRIDE, persisted.update.update_url);
  }
}

/**
 * Download an update via the wanted update channel
 */
function testCheckAndDownloadUpdate() {
  persisted.nextTest = "testUpdateNotAppliedAndDownloadComplete";

  // Check if the user has permissions to run the update
  assert.ok(update.allowed, "User has permissions to update the build");

  // Sanity check for the about dialog
  update.checkAboutDialog(controller);

  // Open the software update dialog and wait until the check has been finished
  update.openDialog(controller);
  update.waitForCheckFinished();

  try {
    // If an update has been found, download the patch
    assert.waitFor(() => update.updatesFound, "An update has been found");
    update.download();
  }
  finally {
    // Store details about the patch
    persisted.updates[persisted.update.index].patch = update.patchInfo;
  }

  // Set the downloaded update into failed state
  update.forceFallback();
}

/**
 * Test that the patch hasn't been applied, and the complete patch gets downloaded
 **/
function testUpdateNotAppliedAndDownloadComplete() {
  persisted.nextTest = "testUpdateAppliedNoOtherUpdate";

  // The dialog should be open in the background and shows a failure
  update.waitForDialogOpen(controller);

  // Complete updates have to be handled differently
  if (persisted.updates[persisted.update.index].patch.is_complete) {
    // Wait for the error page and close the software update dialog
    update.waitForWizardPage(softwareUpdate.WIZARD_PAGES.errors);
    update.closeDialog();

    // Open the software update dialog again and wait until the check has been finished
    update.openDialog(controller);
    update.waitForCheckFinished();

    // If an update has been found, download the patch
    assert.waitFor(() => update.updatesFound, "An update has been found");
    update.download();
  }
  else {
    update.waitForWizardPage(softwareUpdate.WIZARD_PAGES.errorPatching);

    // Start downloading the fallback update
    update.download();
  }

  // Store details about the patch
  persisted.updates[persisted.update.index].patch_fallback = update.patchInfo;
}

/**
 * Test that the update has been correctly applied, and that no further updates
 * of the same type are found.
 */
function testUpdateAppliedNoOtherUpdate() {
  // Collect some data of the current (updated) build
  persisted.updates[persisted.update.index].build_post = update.buildInfo;

  // Open the software update dialog and wait until the check has been finished
  update.openDialog(controller);
  update.waitForCheckFinished();

  // No further updates should be offered now with the same update type
  if (update.updatesFound) {
    update.download(false);

    var lastUpdateType = persisted.updates[persisted.update.index].type;
    expect.notEqual(update.updateType, lastUpdateType,
                    "No more update of the same type offered.");
  }

  // Check that updates have been applied correctly
  update.assertUpdateApplied(persisted);

  // Sanity check the about dialog
  update.checkAboutDialog(controller);

  // Update was successful
  persisted.updates[persisted.update.index].success = true;
}
