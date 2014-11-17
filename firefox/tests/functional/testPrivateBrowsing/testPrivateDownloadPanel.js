/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include the required modules
var { assert } = require("../../../../lib/assertions");
var downloads = require("../../../lib/downloads");
var utils = require("../../../../lib/utils");
var windows = require("../../../../lib/windows");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "downloading/";

const DOWNLOAD_LOCATION = utils.getProfileDownloadLocation();
const DOWNLOADS = {
  normal: [
    "unknown_type.mtdl",
    "unknown_type.fmtd"
  ],
  pbWindow: [
    "unknown_type_pb.stbf"
  ]
};

var setupModule = function (aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.browserWindow = new browser.BrowserWindow();
  aModule.pbWindow = browserWindow.open({private: true, method: "shortcut"});

  aModule.dm = new downloads.downloadManager();

  // Set the Download Folder to %profile%/downloads
  aModule.dm.downloadDir = DOWNLOAD_LOCATION;

  // Clean the Download Manager database
  aModule.dm.cleanAll();
}

var teardownModule = function (aModule) {
  // Clean all downloaded files from the system
  aModule.dm.cleanAll();

  aModule.dm.resetDownloadDir();

  aModule.dm.close();
  windows.closeAllWindows(aModule.browserWindow);
}

/**
 * Test that normal and pbWindow downloads are kept separate
 */
var testPrivateDownloadPanel = function () {

  // Download files of unknown type
  // Normal Browsing
  DOWNLOADS.normal.forEach(function (aFile) {
    downloads.downloadFileOfUnknownType(controller, TEST_DATA + aFile);
  });

  // Private Browsing
  DOWNLOADS.pbWindow.forEach(function (aFile) {
    downloads.downloadFileOfUnknownType(pbWindow.controller, TEST_DATA + aFile);
  });

  // Wait until all downloads have been finished
  assert.waitFor(function () {
    return dm.activeDownloadCount === 0 && dm.activePrivateDownloadCount === 0;
  }, "All downloads have been finished");

  // Open Download Panel and read the downloaded item list
  var downloadedFiles = dm.getPanelDownloads(controller);

  // Check that number of normal downloaded files is identical to the original download list
  assert._deepEqual(downloadedFiles, DOWNLOADS.normal,
                    "Normal Downloads are correctly shown in the Downloads Panel");

  // Open the Private Download Indicator and read the downloaded item list
  var downloadedPBFiles = dm.getPanelDownloads(pbWindow.controller);

  // Check that number of pbWindow downloaded files is identical to the original pbWindow download list
  assert._deepEqual(downloadedPBFiles, DOWNLOADS.pbWindow,
                    "Private Downloads are correctly shown in the Private Downloads Panel");
}
