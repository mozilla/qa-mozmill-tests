/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var files = require("../../../../lib/files");
var prefs = require("../../../../lib/prefs");
var softwareUpdate = require("../../../lib/software-update");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const PREF_UPDATE_AUTO = "app.update.auto";
const PREF_UPDATE_LOG = "app.update.log";
const PREF_UPDATE_URL_OVERRIDE = "app.update.url.override";

function setupTest(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.update = new softwareUpdate.SoftwareUpdate();

  persisted.nextTest = null;
}

function teardownTest(aModule) {
  if (persisted.nextTest) {
    aModule.browserWindow.controller.restartApplication(persisted.nextTest);
  }
}

function teardownModule(aModule) {
  delete persisted.nextTest;

  // Prepare persisted object for the next update
  persisted.update.updateIndex++;

  prefs.clearUserPref(PREF_UPDATE_AUTO);
  prefs.clearUserPref(PREF_UPDATE_LOG);
  prefs.clearUserPref(PREF_UPDATE_URL_OVERRIDE);

  aModule.browserWindow.controller.stopApplication(true);
}

function testPrepareTest() {
  persisted.nextTest = "testCheckAndDownloadUpdate";

  softwareUpdate.initUpdateTests(false);

  // Turn on software update logging
  prefs.setPref(PREF_UPDATE_LOG, true);
  prefs.setPref(PREF_UPDATE_AUTO, false);

  // If requested force a specific update URL
  if (persisted.update.update_url) {
    prefs.setPref(PREF_UPDATE_URL_OVERRIDE, persisted.update.update_url);
  }
}

/**
 * Download an update via the wanted update channel
 */
function testCheckAndDownloadUpdate() {
  persisted.nextTest = "testUpdateAppliedNoOtherUpdate";

  // Check if the user has permissions to run the update
  assert.ok(update.allowed, "User has permissions to update the build");

  // Open the about dialog and check for updates
  var aboutWindow = browserWindow.openAboutWindow();
  aboutWindow.checkForUpdates();

  try {
    assert.waitFor(() => aboutWindow.updatesFound, "An update has been found");
    aboutWindow.download();
    aboutWindow.waitForUpdateApplied();
  }
  finally {
    // Store details about the patch
    persisted.updates[persisted.update.index].patch = aboutWindow.patchInfo;
  }
}

/**
 * Test that the update has been correctly applied, and that no further updates
 * of the same type are found.
 */
function testUpdateAppliedNoOtherUpdate() {
  // Collect some data of the current (updated) build
  persisted.updates[persisted.update.index].build_post = update.buildInfo;


  // Open the about dialog and check for updates
  var aboutWindow = browserWindow.openAboutWindow();
  aboutWindow.checkForUpdates();

  // No further updates should be offered now with the same update type
  if (aboutWindow.updatesFound) {
    aboutWindow.download(false);

    var lastUpdateType = persisted.updates[persisted.update.index].type;
    expect.notEqual(update.updateType, lastUpdateType,
                    "No more update of the same type offered");
  }
  aboutWindow.close();

  // Check that updates have been applied correctly
  update.assertUpdateApplied(persisted);

  // Update was successful
  persisted.updates[persisted.update.index].success = true;
}
