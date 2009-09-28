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
 * @fileoverview
 * The DownloadsAPI adds support for download related functions. It also gives
 * access to the Download Manager.
 *
 * @version 1.0.1
 */

var MODULE_NAME = 'DownloadsAPI';

const gTimeout = 5000;

/**
 * Constructor
 */
function downloadManager()
{
  this._dms = Cc["@mozilla.org/download-manager;1"]
                 .getService(Ci.nsIDownloadManager);

  this._controller = null;
}

/**
 * Download Manager class
 */
downloadManager.prototype = {
  get controller() { return this._controller; },

  /**
   * Returns the number of currently active downloads
   *
   * @returns Number of active downloads
   * @type number
   */
  get activeDownloadCount()
  {
    return this._dms.activeDownloadCount;
  },

  /**
   * Remove all downloads from the database
   */
  cleanUp : function downloadmanager_cleanUp()
  {
    this._dms.cleanUp();
  },

  /**
   * Close the download manager
   */
  close : function downloadmanager_close()
  {
    var windowCount = mozmill.utils.getWindows().length;

    this._controller.keypress(null, 'w', {accelKey: true});
    this._controller.waitForEval("subject.getWindows().length == " + (windowCount - 1),
                         gTimeout, 100, mozmill.utils);
  },

  /**
   * Delete all downloads from the local drive
   *
   * @param {download} downloads
   *        List of downloaded files
   */
  deleteDownloadedFiles : function downloadmanager_deleteDownloadedFiles(downloads)
  {
    downloads.forEach(function(download) {
      try {
        var file = getLocalFileFromNativePathOrUrl(download.target);
        file.remove(false);
      } catch (ex) {
      }
    });
  },

  /**
   * Open the Download Manager
   *
   * @param {MozMillController} controller
   *        MozMillController of the window to operate on
   * @param {boolean} shortcut
   *        If true the keyboard shortcut is used
   */
  open : function downloadmanager_open(controller, shortcut)
  {
    if (shortcut) {
      // XXX: Cannot extract commandKeys from DTD until bug 504635 is fixed
      if (mozmill.isLinux)
        controller.keypress(null, "y", {ctrlKey: true, shiftKey: true});
      else
        controller.keypress(null, "j", {accelKey: true});
    } else {
      controller.click(new elementslib.Elem(controller.menus["tools-menu"].menu_openDownloads));
    }

    // Wait until the window has been opened
    controller.sleep(500);
    controller.waitForEval("subject.getMostRecentWindow('Download:Manager') != null",
                           gTimeout, 100, mozmill.wm);

    var window = mozmill.wm.getMostRecentWindow('Download:Manager');
    this._controller = new mozmill.controller.MozMillController(window);
  },

  /**
   * Get the list of all downloaded files in the database
   *
   * @returns List of downloads
   * @type download
   */
  getAllDownloads : function downloadmanager_getAllDownloads()
  {
    var dbConn = this._dms.DBConnection;
    var stmt = null;

    if (dbConn.schemaVersion < 3)
      return new Array();

    // Run a SQL query and iterate through all results which have been found
    var downloads = [];
    stmt = dbConn.createStatement("SELECT * FROM moz_downloads");
    while (stmt.executeStep()) {
      downloads.push({
        id: stmt.row.id, name: stmt.row.name, target: stmt.row.target,
        tempPath: stmt.row.tempPath, startTime: stmt.row.startTime,
        endTime: stmt.row.endTime, state: stmt.row.state,
        referrer: stmt.row.referrer, entityID: stmt.row.entityID,
        currBytes: stmt.row.currBytes, maxBytes: stmt.row.maxBytes,
        mimeType : stmt.row.mimeType, autoResume: stmt.row.autoResume,
        preferredApplication: stmt.row.preferredApplication,
        preferredAction: stmt.row.preferredAction
      });
    };
    stmt.reset();

    return downloads;
  }
};

/**
 * Download the file of unkown type from the given location by saving it
 * automatically to disk
 *
 * @param {MozMilldmController} controller
 *        MozMillController of the browser window
 * @param {string} url
 *        URL of the file which has to be downloaded
 */
var downloadFileOfUnknownType = function(controller, url)
{
  controller.open(url);

  // Wait until the unknown content type dialog has been opened
  controller.sleep(500);
  controller.waitForEval("subject.getMostRecentWindow('').document.documentElement.id == 'unknownContentType'",
                             gTimeout, 100, mozmill.wm);

  var window = mozmill.wm.getMostRecentWindow('');
  var utController = new mozmill.controller.MozMillController(window);
  utController.sleep(500);

  // Select to save the file directly
  var saveFile = new elementslib.ID(utController.window.document, "save");
  utController.waitThenClick(saveFile, gTimeout);
  utController.waitForEval("subject.selected == true", gTimeout, 100,
                         saveFile.getNode());

  // The OK button is lazily updated. So wait a bit.
  var button = new elementslib.Lookup(utController.window.document, '/id("unknownContentType")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  utController.waitThenClick(button);

  utController.waitForEval("subject.getMostRecentWindow('') != this.window",
                         gTimeout, 100, mozmill.wm);
}

/**
 * Get a local file from a native path or URL
 *
 * @param {string} aPathOrUrl
 *        Native path or URL of the file
 * @see http://mxr.mozilla.org/mozilla-central/source/toolkit/mozapps/downloads/content/downloads.js#1309
 */
function getLocalFileFromNativePathOrUrl(aPathOrUrl)
{
  if (aPathOrUrl.substring(0,7) == "file://") {
    // if this is a URL, get the file from that
    let ioSvc = Cc["@mozilla.org/network/io-service;1"]
                   .getService(Ci.nsIIOService);

    // XXX it's possible that using a null char-set here is bad
    const fileUrl = ioSvc.newURI(aPathOrUrl, null, null)
                         .QueryInterface(Ci.nsIFileURL);
    return fileUrl.file.clone().QueryInterface(Ci.nsILocalFile);
  } else {
    // if it's a pathname, create the nsILocalFile directly
    var f = new nsLocalFile(aPathOrUrl);
    return f;
  }
}
