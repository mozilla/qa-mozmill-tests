/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var downloads = require("../../../../lib/downloads");
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const TEST_DATA = "ftp://ftp.mozilla.org/pub/mozilla.org/firefox/releases/31.0/source/firefox-31.0.bundle";

const PREF_PANEL_SHOWN = "browser.download.panel.shown";

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.downloadsPanel = aModule.browserWindow.navBar.downloadsPanel;

  // Bug 959103
  // Downloads gets duplicated with a new profile
  // Remove pref once this is fixed
  prefs.setPref(PREF_PANEL_SHOWN, true);

  // Maximize the browser window because the download panel button is not
  // displayed on smaller window sizes hence the downloads panel is not open
  aModule.browserWindow.maximize();
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_PANEL_SHOWN);
  downloads.removeAllDownloads();
  aModule.downloadsPanel.close({force: true});

  aModule.browserWindow.restore();
}

/**
 * Test download states:
 * Downloading, Canceled, and Retry
 */
function testDownloadPanel() {
  // Initialize state variable
  var state = downloads.DOWNLOAD_STATE["notStarted"];

  var dialog = browserWindow.openUnknownContentTypeDialog(() => {
    browserWindow.controller.open(TEST_DATA);
  });

  dialog.save();

  downloadsPanel.open();
  assert.ok(downloadsPanel.isOpen, "Downloads panel is open");

  var downloadItem = downloadsPanel.getElement({type: "download", value: 0});
  expect.ok(utils.isDisplayed(browserWindow.controller, downloadItem),
            "List element has been found");
  assert.waitFor(() => {
    state = downloadsPanel.getDownloadStatus(downloadItem);
    return (state === downloads.DOWNLOAD_STATE["downloading"]);
  }, "The file is downloading");

  // Cancel the download
  var cancelDownload = downloadsPanel.getElement({type: "downloadButton",
                                                  subtype: "cancel",
                                                  value: 0});
  cancelDownload.click();

  assert.waitFor(() => {
    state = downloadsPanel.getDownloadStatus(downloadItem);
    return (state === downloads.DOWNLOAD_STATE["canceled"]);
  }, "Download has been canceled");

  // Retry the download
  var retryDownload = downloadsPanel.getElement({type: "downloadButton",
                                                 subtype: "retry",
                                                 value: 0});
  retryDownload.click();
  assert.waitFor(() => {
    state = downloadsPanel.getDownloadStatus(downloadItem);
    return (state === downloads.DOWNLOAD_STATE["downloading"]);
  }, "The file is downloading after retry");

  // Cancel the download again
  cancelDownload.click();
  assert.waitFor(() => {
    state = downloadsPanel.getDownloadStatus(downloadItem);
    return (state === downloads.DOWNLOAD_STATE["canceled"]);
  }, "Download has been canceled");

  downloadsPanel.close();
}
