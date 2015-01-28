/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Downloads.jsm");

// Include the required modules
var files = require("files");
var prefs = require("prefs");

const DOWNLOAD_TYPE = {
  all     : Downloads.ALL,
  public  : Downloads.PUBLIC,
  private : Downloads.PRIVATE
};

const PREF_DOWNLOAD_DIR = "browser.download.dir";
const PREF_DOWNLOAD_FOLDERLIST = "browser.download.folderList";

// List of available download states
const DOWNLOAD_STATE = {
  notStarted      : -1,
  downloading     : 0,
  finished        : 1,
  failed          : 2,
  canceled        : 3,
  paused          : 4,
  queued          : 5,
  blockedParental : 6,
  scanning        : 7,
  dirty           : 8,
  blockedPolicy   : 9
};

/**
 * Returns a new DownloadList object.
 *
 * @param {string} [aType="all"]
 *        Type of downloads to return ("all", "private", "public")
 *
 * @returns {DownloadList} Object that handles the list of downloads
 */
function getDownloadList(aType="all") {
  var downloadList = null;
  Downloads.getList(DOWNLOAD_TYPE[aType]).then(aDownloadList => {
    aDownloadList.getAll().then(aDownloads => {
      downloadList = aDownloads;
    });
  });

  expect.waitFor(() => !!downloadList, "Download list has been retrieved");

  return downloadList;
}

/**
 * Returns the current download location.
 *
 * @returns {string} Download location directory.
 */
function getDownloadLocation() {
  return prefs.getPref(PREF_DOWNLOAD_DIR, "");
}

/**
 * Remove all downloads
 *
 * @params {string} [aType="all"]
 *         Type of downloads to remove ("all", "private", "public")
 */
function removeAllDownloads(aType="all") {
  var removed = 0;
  var toRemove = 0;
  var view = {
    onDownloadRemoved: aDownload => {
      removed++;
    }
  }

  Downloads.getList(DOWNLOAD_TYPE[aType]).then(aDownloadList => {
    aDownloadList.addView(view);
    aDownloadList.getAll().then(aDownloads => {
      toRemove = aDownloads.length;
      aDownloads.forEach(aDownload => {
        aDownloadList.remove(aDownload);
      });
    });
  });

  assert.waitFor(() => (toRemove === removed),
                 "All downloads have been removed");
}

/**
 * Resets the download location to the defaults
 */
function resetDownloadLocation() {
  prefs.clearUserPref(PREF_DOWNLOAD_DIR);
  prefs.clearUserPref(PREF_DOWNLOAD_FOLDERLIST);
}

/**
 * Sets the download location
 *
 * @params {string} aDownloadLocation
 *         Location for the downloads directory relative to the profile directory
 */
function setDownloadLocation(aDownloadLocation) {
  var downloadLocation = files.getProfileResource(aDownloadLocation).path;
  prefs.setPref(PREF_DOWNLOAD_DIR, downloadLocation);
  prefs.setPref(PREF_DOWNLOAD_FOLDERLIST, 2);
}

/**
 * Wait for all pending downloads to finish
 *
 * @param {number} aTimeout
 *        Timeout to wait for the downloads to finish
 * @param {string} [aType="all"]
 *        Type of downloads to wait for ("all", "private", "public")
 */
function waitAllDownloadsFinished(aTimeout, aType="all") {
  var activeDownloads = null;
  Downloads.getList(DOWNLOAD_TYPE[aType]).then(aDownloadList => {
    aDownloadList.getAll().then(aDownloads => {
      activeDownloads = aDownloads.length;
      aDownloads.forEach(aDownload => {
        aDownload.whenSucceeded().then(aSucceeded => {
          activeDownloads--;
        });
      });
    });
  });

  assert.waitFor(() => (activeDownloads === 0), aTimeout,
                 "All downloads have been finished");
}

// Exports of variables
exports.DOWNLOAD_STATE = DOWNLOAD_STATE;

// Exports methods
exports.getDownloadList = getDownloadList;
exports.getDownloadLocation = getDownloadLocation;
exports.removeAllDownloads = removeAllDownloads;
exports.resetDownloadLocation = resetDownloadLocation;
exports.setDownloadLocation = setDownloadLocation;
exports.waitAllDownloadsFinished = waitAllDownloadsFinished;
