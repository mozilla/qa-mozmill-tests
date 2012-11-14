/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { assert, expect } = require("../../../lib/assertions");
var downloads = require("../../../lib/downloads");
var prefs = require("../../../lib/prefs");
var privateBrowsing = require("../../../lib/private-browsing");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');

const DOWNLOADS = [
                   LOCAL_TEST_FOLDER + "downloading/unknown_type.mtdl",
                   LOCAL_TEST_FOLDER + "downloading/unknown_type.fmtd"
                  ];

const DOWNLOAD_PB = LOCAL_TEST_FOLDER + "downloading/unknown_type_pb.stbf";

const PREF_DOWNLOAD_USE_TOOLKIT = "browser.download.useToolkitUI";
const PREF_DOWNLOAD_SHOW_STARTING = "browser.download.manager.showWhenStarting";

var setupModule = function(module) {
  controller = mozmill.getBrowserController();

  // Make sure there are no active downloads, downloaded files
  // or data in the Download Manager database before beginning
  dm = new downloads.downloadManager();
  dm.cleanAll();

  // Enable the old tookit UI to test the download manager
  prefs.preferences.setPref(PREF_DOWNLOAD_USE_TOOLKIT, true);

  // Disable the opening of the Downloads Manager when starting a download
  prefs.preferences.setPref(PREF_DOWNLOAD_SHOW_STARTING, false);

  // Array for downloaded files
  downloadedFiles = [];

  // Make sure we are not in PB mode and don't show a prompt
  pb = new privateBrowsing.privateBrowsing(controller);
  pb.enabled = false;
  pb.showPrompt = false;
}

var teardownModule = function(module) {
  // Clean all downloaded files from the system
  dm.cleanAll(downloadedFiles);

  // Make sure the browser is not in Private Browsing mode
  pb.reset();

  prefs.preferences.clearUserPref(PREF_DOWNLOAD_SHOW_STARTING);
  prefs.preferences.clearUserPref(PREF_DOWNLOAD_USE_TOOLKIT);
}

/**
 * Test that no downloads are shown when switching in/out of PB mode
 */
var testDownloadManagerClosed = function() {
  // Download two files of unknown type
  for (var i = 0; i < DOWNLOADS.length; i++) {
    downloads.downloadFileOfUnknownType(controller, DOWNLOADS[i]);
  }

  // Save information of currently downloaded files
  downloadedFiles = dm.getAllDownloads();

  // Wait until all downloads have been finished
  assert.waitFor(function () {
    return dm.activeDownloadCount === 0;
  }, "All downloads have been finished");

  // Enable Private Browsing mode
  pb.start();

  // Open the Download Manager
  dm.open(controller);

  // Get a list of downloaded items in the Download Manager
  var downloadView = new elementslib.ID(dm.controller.window.document, "downloadView");
  dm.controller.waitForElement(downloadView);

  // Check that no items are listed in the Download Manager
  assert.waitFor(function () {
    return downloadView.getNode().itemCount === 0;
  }, "The Download Manager has been cleared");

  // Close the Download Manager
  dm.close();

  // Download a file in Private Browsing mode
  downloads.downloadFileOfUnknownType(controller, DOWNLOAD_PB);

  // Track the download from Private Browsing mode too
  downloadedFiles = downloadedFiles.concat(dm.getAllDownloads());

  // Wait until all downloads have been finished
  assert.waitFor(function () {
    return dm.activeDownloadCount === 0;
  }, "All downloads have been finished");

  // Exit Private Browsing mode
  pb.stop();

  // Open the Download Manager
  dm.open(controller);

  // Get the list of the downloads in the Download Manager
  downloadView = new elementslib.ID(dm.controller.window.document, "downloadView");
  dm.controller.waitForElement(downloadView);

  // The Download Manager should contain the two items downloaded pre-Private Browsing
  assert.waitFor(function () {
    return downloadView.getNode().itemCount === DOWNLOADS.length;
  }, "Download Manager contains pre-Private Browsing downloaded items - got: " +
    downloadView.getNode().itemCount + ", expected " + DOWNLOADS.length);

  for (i = 0; i < DOWNLOADS.length; i++) {
    var download = new elementslib.ID(dm.controller.window.document, "dl" + (i + 1));
    expect.equal(download.getNode().getAttribute("uri"), DOWNLOADS[i],
                 "File appears in download list");
  }

  // Close the Download Manager
  dm.close();
}

setupModule.__force_skip__ = "Bug 823064 - Refactor for the new PB per-window mode";
teardownModule.__force_skip__ = "Bug 823064 - Refactor for the new PB per-window mode";
