/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Anthony Hughes <anthony.s.hughes@gmail.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Include the required modules
var downloads = require("../../shared-modules/downloads");
var prefs = require("../../shared-modules/prefs");
var privateBrowsing = require("../../shared-modules/private-browsing");
var utils = require("../../shared-modules/utils");

const DELAY = 100;
const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');

const DOWNLOADS = [
                   LOCAL_TEST_FOLDER + "downloading/unknown_type.mtdl",
                   LOCAL_TEST_FOLDER + "downloading/unknown_type.fmtd"
                  ];
                   
const DOWNLOAD_PB = LOCAL_TEST_FOLDER + "downloading/unknown_type_pb.stbf";

var setupModule = function(module) {
  controller = mozmill.getBrowserController();

  // Make sure there are no active downloads, downloaded files
  // or data in the Download Manager database before beginning
  dm = new downloads.downloadManager();
  dm.cleanAll();

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

  // Reset the "Show Downloads When Downloading" pref
  prefs.preferences.clearUserPref("browser.download.manager.showWhenStarting");
}

/**
 * Test that no downloads are shown when switching in/out of PB mode
 */
var testDownloadManagerClosed = function() {
  // Disable the opening of the Downloads Manager when starting a download
  prefs.openPreferencesDialog(handlePrefDialog);

  // Download two files of unknown type
  for (var i = 0; i < DOWNLOADS.length; i++) {
    downloads.downloadFileOfUnknownType(controller, DOWNLOADS[i]);
  }

  // Save information of currently downloaded files
  downloadedFiles = dm.getAllDownloads();

  // Wait until all downloads have been finished
  controller.waitForEval("subject.activeDownloadCount == 0", TIMEOUT, DELAY, dm);

  // Enable Private Browsing mode
  pb.start();

  // Open the Download Manager
  dm.open(controller);

  // Get a list of downloaded items in the Download Manager
  var downloadView = new elementslib.ID(dm.controller.window.document, "downloadView");
  dm.controller.waitForElement(downloadView, TIMEOUT);
  
  // Check that no items are listed in the Download Manager
  dm.controller.waitForEval("subject.itemCount == 0",
                            TIMEOUT, DELAY, downloadView.getNode());

  // Close the Download Manager
  dm.close();

  // Download a file in Private Browsing mode
  downloads.downloadFileOfUnknownType(controller, DOWNLOAD_PB);

  // Track the download from Private Browsing mode too
  downloadedFiles = downloadedFiles.concat(dm.getAllDownloads());

  // Wait until all downloads have been finished
  controller.waitForEval("subject.activeDownloadCount == 0", TIMEOUT, DELAY, dm);

  // Exit Private Browsing mode
  pb.stop();

  // Open the Download Manager
  dm.open(controller);

  // Get the list of the downloads in the Download Manager
  downloadView = new elementslib.ID(dm.controller.window.document, "downloadView");
  dm.controller.waitForElement(downloadView, TIMEOUT);
  
  // The Download Manager should contain the two items downloaded pre-Private Browsing
  dm.controller.waitForEval("subject.isCorrectDownloadNumber == true", TIMEOUT, DELAY, 
                            {isCorrectDownloadNumber: downloadView.getNode().itemCount == DOWNLOADS.length});

  for (i = 0; i < DOWNLOADS.length; i++) {
    var download = new elementslib.ID(dm.controller.window.document, "dl" + (i + 1));
    dm.controller.assertJS("subject.isCorrectDownload == true",
                           {isCorrectDownload: download.getNode().getAttribute('uri') == DOWNLOADS[i]});
  }
    
  // Close the Download Manager
  dm.close();
}

/**
 * Deactivate the auto-open feature of the downloads manager
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var handlePrefDialog = function(controller)
{
  // Set the Preferences dialog to the Main pane
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneMain';

  // Don't show the download manager when a download starts
  var show = new elementslib.ID(controller.window.document, "showWhenDownloading");
  controller.waitForElement(show, TIMEOUT);
  controller.check(show, false);

  // Close the Preferences dialog
  prefDialog.close(true);
}

/**
 * Map test functions to litmus tests
 */
// testDownloadManagerClosed.meta = {litmusids : [9178]};
