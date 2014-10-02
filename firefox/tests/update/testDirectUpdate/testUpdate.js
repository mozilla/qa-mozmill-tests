/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var files = require("../../../../lib/files");
var prefs = require("../../../lib/prefs");
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

  prefs.preferences.clearUserPref(PREF_UPDATE_LOG);
  prefs.preferences.clearUserPref(PREF_UPDATE_URL_OVERRIDE);

  aModule.controller.stopApplication(true);
}

function testPrepareTest() {
  persisted.nextTest = "testCheckAndDownloadUpdate";

  softwareUpdate.initUpdateTests(false);

  // Turn on software update logging
  prefs.preferences.setPref(PREF_UPDATE_LOG, true);

  // If requested force a specific update URL
  if (persisted.update.update_url) {
    prefs.preferences.setPref(PREF_UPDATE_URL_OVERRIDE,
                              persisted.update.update_url);
  }
}

/**
 * Download an update via the wanted update channel
 */
function testCheckAndDownloadUpdate() {
  persisted.nextTest = "testUpdateAppliedNoOtherUpdate";

  // Check if the user has permissions to run the update
  assert.ok(update.allowed, "User has permissions to update the build");

  // Sanity check for the about dialog
  update.checkAboutDialog(controller);

  // Open the software update dialog and wait until the check has been finished
  update.openDialog(controller);
  update.waitForCheckFinished();

  // If an update has been found, download the patch
  assert.waitFor(() => update.updatesFound, "An update has been found");
  update.download();

  // Store details about the patch
  persisted.updates[persisted.update.index].patch = update.patchInfo;
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
                    "No more update of the same type offered");
  }

  // Check that updates have been applied correctly
  update.assertUpdateApplied(persisted);

  // Sanity check the about dialog
  update.checkAboutDialog(controller);

  // Update was successful
  persisted.updates[persisted.update.index].success = true;
}
