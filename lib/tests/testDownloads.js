/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var downloads = require("../downloads");

const TEST_DATA = "ftp://ftp.mozilla.org/pub/firefox/releases/3.6/mac/en-US/" +
                  "Firefox%203.6.dmg";

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  module.dm = new downloads.downloadManager();
}

var teardownModule = function(module) {
  // Cancel all downloads and close the download manager
  dm.cancelActiveDownloads();
  dm.close();
}

var testOpenDownloadManager = function() {
  downloads.downloadFileOfUnknownType(controller, TEST_DATA);

  // Open the download manager
  dm.open(controller, true);

  // Get the Firefox download
  var download = dm.getElement({type: "download", subtype: "state", value : "0"});
  dm.controller.waitForElement(download);

  var pauseButton = dm.getElement({type: "download_button", subtype: "pause", value: download});
  var resumeButton = dm.getElement({type: "download_button", subtype: "resume", value: download});

  // Pause the download
  dm.controller.click(pauseButton);
  dm.waitForDownloadState(download, downloads.downloadState.paused);

  // Resume the download
  dm.controller.click(resumeButton);
  dm.waitForDownloadState(download, downloads.downloadState.downloading);
}
