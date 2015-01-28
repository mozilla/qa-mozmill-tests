/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var browser = require("../ui/browser");
var downloads = require("../../../lib/downloads");

const BASE_URL = collector.addHttpResource("../../../data/");
const TEST_DATA = BASE_URL + "downloading/unknown_type.mtdl";

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
}

function teardownModule(aModule) {
  downloads.removeAllDownloads();
}

/**
 * Download a file of unknown type
 */
function testDownloadFileOfUnknownType() {
  var dialog = browserWindow.openUnknownContentTypeDialog(() => {
    browserWindow.controller.open(TEST_DATA);
  });

  dialog.save();

  // Check that the download is properly added to the list
  var downloadList = downloads.getDownloadList();
  expect.equal(downloadList.length, 1,
               "One download has been added to the list");

  // Shouldn't take more than 2 seconds to download the local file
  expect.waitFor(() => downloadList[0].succeeded, "Download finished");
}
