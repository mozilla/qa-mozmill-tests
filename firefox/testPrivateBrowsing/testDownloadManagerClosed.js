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

/**
 *  Litmus test ID #7434 - No downloads visible when switching in/out of Private Browsing mode (window closed)
 */

var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['DownloadsAPI', 'PrefsAPI', 'PrivateBrowsingAPI', 'UtilsAPI'];

const gDelay = 100;
const gTimeout = 5000;

const downloads = [
                   "http://www.adobe.com/education/pdf/etd/etd_lesson2.pdf",
                   "http://garr.dl.sourceforge.net/sourceforge/rarexpander/rar_expander_v085_beta3.dmg"
                  ];

const downloadsPB = [
                     "http://www.bzip.org/1.0.5/bzip2-1.0.5.tar.gz"
                    ];

var setupModule = function(module)
{
  module.controller = mozmill.getBrowserController();
  module.dm = new DownloadsAPI.downloadManager();
  module.dm.cleanUp();

  // Array for downloaded files
  module.curDownloads = [];

  // Make sure we are not in PB mode and don't show a prompt
  module.pb = new PrivateBrowsingAPI.privateBrowsing(controller);
  module.pb.enabled = false;
  module.pb.showPrompt = false;
}

var teardownModule = function(module)
{
  // Remove all the downloaded files
  module.dm.deleteDownloadedFiles(module.curDownloads);

  // Reset Private Browsing prefs/state
  module.pb.showPrompt = true;
  module.pb.enabled = false;

  try {
    PrefsAPI.preferences.branch.clearUserPref("browser.download.manager.showWhenStarting");
  } catch (ex) {
  }
}

/**
 * Test that no downloads are shown when switching in/out of PB mode
 */
var testDownloadManagerClosed = function()
{
  // Disable the opening of the Downloads Manager when starting a download
  PrefsAPI.preferencesDialog.open(handlePrefDialog);

  // Download a couple of files
  for (var ii = 0; ii < downloads.length; ii++)
    DownloadsAPI.downloadFileOfUnknownType(controller, downloads[ii]);

  // Wait until all downloads have been finished
  controller.sleep(100);
  controller.waitForEval("subject.activeDownloadCount == 0", 30000, 100, dm);

  // Save information of currently downloaded files
  curDownloads = dm.getAllDownloads();

  // Enable Private Browsing mode
  pb.start();

  // Check that no downloads are shown
  dm.open(controller);

  var downloadView = new elementslib.ID(dm.controller.window.document, "downloadView");
  dm.controller.waitForElement(downloadView, gTimeout);
  dm.controller.waitForEval("subject.itemCount == 0",
                            gTimeout, 100, downloadView.getNode());

  // Close the Download Manager
  dm.close();

  // Download a file in Private Browsing mode
  DownloadsAPI.downloadFileOfUnknownType(controller, downloadsPB[0]);

  // Wait until all downloads have been finished
  controller.sleep(100);
  controller.waitForEval("subject.activeDownloadCount == 0", 30000, 100, dm);

  // Track the download from Private Browsing mode too
  curDownloads = curDownloads.concat(dm.getAllDownloads());

  pb.stop();

  // Check that the downloads from before the Private Browsing mode are shown
  dm.open(controller);

  downloadView = new elementslib.ID(dm.controller.window.document, "downloadView");
  dm.controller.waitForElement(downloadView, gTimeout);
  dm.controller.waitForEval("subject.itemCount == " + downloads.length,
                            gTimeout, 100, downloadView.getNode());

  for (var ii = 0; ii < downloads.length; ii++) {
    var item = new elementslib.ID(dm.controller.window.document, "dl" + (ii + 1));
    dm.controller.assertJS(item.getNode().getAttribute('uri') == downloads[ii]);
  }

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
  PrefsAPI.preferencesDialog.setPane(controller, 'paneMain');

  // Don't show the download manager when a download starts
  var show = new elementslib.ID(controller.window.document, "showWhenDownloading");
  controller.waitForElement(show, gTimeout);
  controller.check(show, false);

  controller.sleep(1000);
  PrefsAPI.preferencesDialog.close(controller, true);
}
