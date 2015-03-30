/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include the required modules
var downloads = require("../../../../lib/downloads");
var prefs = require("../../../../lib/prefs");
var windows = require("../../../../lib/windows");

var browser = require ("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "downloading/";

const PREF_PANEL_SHOWN = "browser.download.panel.shown";

const DOWNLOADS = {
  normal: [
    "unknown_type.mtdl",
    "unknown_type.fmtd"
  ],
  pbWindow: [
    "unknown_type_pb.stbf"
  ]
};

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.downloadsPanel = aModule.browserWindow.navBar.downloadsPanel;

  // PB Window
  aModule.pbBrowserWindow = browserWindow.open({private: true, method: "shortcut"});
  aModule.pbDownloadsPanel = aModule.pbBrowserWindow.navBar.downloadsPanel;

  // Set the Download Folder to %profile%/downloads
  downloads.setDownloadLocation("downloads");

  // Bug 959103
  // Download gets duplicated and stuck with a new profile
  // Remove this pref once bug has been fixed
  prefs.setPref(PREF_PANEL_SHOWN, true);

  // Maximize the browser windows because the download panel button is not
  // displayed on smaller window sizes hence the download panel is not open
  aModule.browserWindow.maximize();
  aModule.pbBrowserWindow.maximize();
}

function teardownModule(aModule) {
  downloads.removeAllDownloads();
  downloads.resetDownloadLocation();
  prefs.clearUserPref(PREF_PANEL_SHOWN);

  aModule.downloadsPanel.close({force: true});
  aModule.pbDownloadsPanel.close({force: true});

  aModule.browserWindow.restore();
  aModule.pbBrowserWindow.restore();

  windows.closeAllWindows(aModule.browserWindow);
}

/**
 * Test that normal and pbWindow downloads are kept separate
 */
function testPrivateDownloadPanel() {
  // Download files of unknown type
  // Normal Browsing
  DOWNLOADS.normal.forEach(aFile => {
    var dialog = browserWindow.openUnknownContentTypeDialog(() => {
      browserWindow.controller.open(TEST_DATA + aFile);
    });

    dialog.save();
  });

  // Private Browsing
  DOWNLOADS.pbWindow.forEach(aFile => {
    var dialog = pbBrowserWindow.openUnknownContentTypeDialog(() => {
      pbBrowserWindow.controller.open(TEST_DATA + aFile);
    });

    dialog.save();
  });

  // Wait until all downloads have been finished
  downloads.waitAllDownloadsFinished();

  // Open the Download panel of the non-private browsing window
  // and check that we downloaded the correct files
  downloadsPanel.open();
  var downloadsList = downloadsPanel.getElements({type: "downloads"});
  assert.equal(downloadsList.length, 2,
               "File was downloaded in non-private window");
  downloadsPanel.close();

  // Open the Download panel of the private browsing window
  // and check that we downloaded the correct files
  pbDownloadsPanel.open();
  downloadsList = pbDownloadsPanel.getElements({type: "downloads"});
  assert.equal(downloadsList.length, 1,
               "File was downloaded in private window");
  pbDownloadsPanel.close();
}
