/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var downloads = require("../../../lib/downloads");

const TEST_DATA = "ftp://ftp.mozilla.org/pub/firefox/releases/3.6/source/" +
                  "firefox-3.6.source.tar.bz2";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.dm = new downloads.downloadManager();

  // Make sure Download Manager is clean before starting
  aModule.dm.cleanAll();
}

var teardownModule = function(aModule) {
  aModule.dm.cleanAll();
  aModule.dm.close();
}

/*
 * This tests all four download states:
 *   Pause, Resume, Cancel, and Retry
 */
var testDownloadStates = function() {
  // Download a file
  downloads.downloadFileOfUnknownType(controller, TEST_DATA);

  // Wait for the Download Manager to open
  dm.waitForOpened(controller);

  // Get the download object
  var download = dm.getElement({type: "download", subtype: "id", value: "dl1"});
  controller.waitForElement(download);

  // Click the pause button and verify the download is paused
  var pauseButton = dm.getElement({type: "download_button", subtype: "pause", value: download});
  controller.waitThenClick(pauseButton);
  dm.waitForDownloadState(download, downloads.downloadState.paused);

  // Click the resume button and verify the download is active
  var resumeButton = dm.getElement({type: "download_button", subtype: "resume", value: download});
  controller.waitThenClick(resumeButton);
  dm.waitForDownloadState(download, downloads.downloadState.downloading);

  // Click the cancel button and verify the download is canceled
  var cancelButton = dm.getElement({type: "download_button", subtype: "cancel", value: download});
  controller.waitThenClick(cancelButton);
  dm.waitForDownloadState(download, downloads.downloadState.canceled);

  // Click the retry button and verify the download is active
  var retryButton = dm.getElement({type: "download_button", subtype: "retry", value: download});
  controller.waitThenClick(retryButton);
  dm.waitForDownloadState(download, downloads.downloadState.downloading);
}

 // Bug 631246
 // Test randomly displays a simplified version of the Save File dialog
 // but programmatically expects the full version of the Save File dialog
 setupModule.__force_skip__ = "Bug 631246: Unexpected SIMPLE version of Save File dialog";
 teardownModule.__force_skip__ = "Bug 631246: Unexpected SIMPLE version of Save File dialog";
