/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource://gre/modules/Services.jsm");

// Include the required modules
var { assert } = require("../../../lib/assertions");
var downloads = require("../../../lib/downloads");
var privateBrowsing = require("../../../lib/ui/private-browsing");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource("../../../data/downloading/");

const DOWNLOAD_LOCATION = utils.getProfileDownloadLocation();
const DOWNLOADS = {
  normal: [
    "unknown_type.mtdl",
    "unknown_type.fmtd"
  ],
  pb: [
    "unknown_type_pb.stbf",
    "unknown_type_pb.dets"
  ]
};

var setupModule = function () {
  controller = mozmill.getBrowserController();

  pb = new privateBrowsing.PrivateBrowsingWindow();
  pb.open(controller);

  dm = new downloads.downloadManager();

  // Set the Download Folder to %profile%/downloads
  dm.DownloadLocation = DOWNLOAD_LOCATION;

  // Clean the Download Manager database
  dm.cleanAll();
}

var teardownModule = function () {
  // Clean all downloaded files from the system
  dm.cleanAll();

  dm.resetDownloadLocation();

  dm.close();
  pb.close();
}

/**
 * Test that normal and pb downloads are kept separate
 */
var testPrivateDownloadPanel = function () {

  // Download files of unknown type
  // Normal Browsing
  DOWNLOADS.normal.forEach(function (aFile) {
    downloads.downloadFileOfUnknownType(controller, LOCAL_TEST_FOLDER + aFile);
  });

  // Private Browsing
  DOWNLOADS.pb.forEach(function (aFile) {
    downloads.downloadFileOfUnknownType(pb.controller, LOCAL_TEST_FOLDER + aFile);
  });

  // Wait until all downloads have been finished
  assert.waitFor(function () {
    return dm.activeDownloadCount === 0 && dm.activePrivateDownloadCount === 0;
  }, "All downloads have been finished");

  // Open Download Panel and read the downloaded item list
  var downloadedFiles = dm.getPanelDownloads(controller);

  // Check that number of normal downloaded files is identical to the original download list
  var intersection = utils.arrayIntersection(downloadedFiles, DOWNLOADS.normal);
  assert.equal(intersection.length, DOWNLOADS.normal.length,
               "Normal Downloads are correctly shown in the Downloads Indicator Panel");

  // Open the Private Download Indicator and read the downloaded item list
  var downloadedPBFiles = dm.getPanelDownloads(pb.controller);

  // Check that number of pb downloaded files is identical to the original pb download list
  var PBIntersection = utils.arrayIntersection(downloadedPBFiles, DOWNLOADS.pb);
  assert.equal(PBIntersection.length, DOWNLOADS.pb.length,
               "Private Downloads are correctly shown in the Private Downloads Indicator Panel");
}
