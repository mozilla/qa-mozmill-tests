/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The DownloadsAPI adds support for download related functions. It also gives
 * access to the Download Manager.
 *
 * @version 1.0.1
 */

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var { assert } = require("assertions");
var domUtils = require("dom-utils");
var prefs = require("prefs");
var utils = require("utils");

const G_TIMEOUT = 5000;

const PREF_DOWNLOAD_DIR = "browser.download.dir";
// Needs to be set to 2 for custom download path to be used
const PREF_DOWNLOAD_FOLDERLIST = "browser.download.folderList";

/**
 * List of available download states
 */
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
}

/**
 * Constructor
 */
function downloadManager() {
  this._controller = null;
  this.downloadState = DOWNLOAD_STATE;
}

/**
 * Download Manager class
 */
downloadManager.prototype = {
  /**
   * Returns the controller of the current window
   *
   * @returns Mozmill Controller
   * @type {MozMillController}
   */
  get controller() {
    return this._controller;
  },

  /**
   * Returns the number of currently active downloads
   *
   * @returns {number} Number of active downloads
   */
  get activeDownloadCount() {
    return Services.downloads.activeDownloadCount;
  },

  /**
   * Returns the number of currently active private downloads
   *
   * @returns {number} Number of active downloads
   */
  get activePrivateDownloadCount() {
    return Services.downloads.activePrivateDownloadCount;
  },

  /**
   * Cancel all active downloads
   */
  cancelActiveDownloads : function downloadManager_cancelActiveDownloads() {
    // Get a list of all active downloads (nsISimpleEnumerator)
    var downloads = Services.downloads.activeDownloads;

    // Iterate through each active download and cancel it
    while (downloads.hasMoreElements()) {
      var download = downloads.getNext().QueryInterface(Ci.nsIDownload);
      Services.downloads.cancelDownload(download.id);
    }
  },

  /**
   * Remove all downloads from the database
   */
  cleanUp : function downloadManager_cleanUp() {
    Services.downloads.cleanUp();
  },

  /**
   * Cancel any active downloads, remove the files, and clean
   * up the Download Manager database
   *
   * @param {Array of download} downloads
   *        Downloaded files which should be deleted (optional)
   */
  cleanAll : function downloadManager_cleanAll(downloads) {
    // Cancel any active downloads
    this.cancelActiveDownloads();

    // If no downloads have been specified retrieve the list from the database
    if (downloads === undefined || downloads.length == 0)
      downloads = this.getAllDownloads();
    else
      downloads = downloads.concat(this.getAllDownloads());

    // Delete all files referred to in the Download Manager
    this.deleteDownloadedFiles(downloads);

    // Clean any entries from the Download Manager database
    this.cleanUp();
  },

  /**
   * Close the download manager
   *
   * @param {boolean} force
   *        Force the closing of the DM window
   */
  close : function downloadManager_close(force) {
    var windowCount = mozmill.utils.getWindows().length;

    if (this._controller) {
      // Check if we should force the closing of the DM window
      if (force) {
        this._controller.window.close();
      } else {
        var cmdKey = utils.getEntity(this.getDtds(), "cmd.close.commandKey");
        this._controller.keypress(null, cmdKey, {accelKey: true});
      }

      assert.waitFor(function () {
        return mozmill.utils.getWindows().length === (windowCount - 1);
      }, "Download Manager has been closed");
      this._controller = null;
    }
  },

  /**
   * Delete all downloads from the local drive
   *
   * @param {download} downloads
   *        List of downloaded files
   */
  deleteDownloadedFiles : function downloadManager_deleteDownloadedFiles(downloads) {
    downloads.forEach(function(download) {
      try {
        var file = getLocalFileFromNativePathOrUrl(download.target);
        file.remove(false);
      } catch (ex) {
      }
    });
  },

  /**
   * Get the list of all downloaded files in the database
   *
   * @returns {Array} List of downloads
   */
  getAllDownloads : function downloadManager_getAllDownloads() {
    return this.getPublicDownloads().concat(this.getPrivateDownloads());
  },

  /**
   * Get the list of Public Downloads
   *
   * @return {Array} List of downloads
   */
  getPublicDownloads : function downloadManager_getPublicDownloads() {
    return this._getDownloads(Services.downloads.DBConnection);
  },

  /**
   * Get the list of Private Downloads
   *
   * @return {Array} List of downloads
   */
  getPrivateDownloads : function downloadManager_getPrivateDownloads() {
    return this._getDownloads(Services.downloads.privateDBConnection);
  },

  /**
   * Get a list of normal or private downloads
   *
   * @param {mozIStorageConnection} aDBConnection Where downloads are stored
   * @returns {Array} List of downloads
   */
  _getDownloads : function downloadManager_getDownloads(aDBConnection) {
    var stmt = null;

    // Run a SQL query and iterate through all results which have been found
    var downloads = [];
    stmt = aDBConnection.createStatement("SELECT * FROM moz_downloads");
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
  },

  /**
   * Gets the download state of the given download
   *
   * @param {ElemBase} download
   *        Download which state should be checked
   */
  getDownloadState : function downloadManager_getDownloadState(download) {
    return download.getNode().getAttribute('state');
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function downloadManager_getDtds() {
    var dtds = ["chrome://browser/locale/browser.dtd",
                "chrome://mozapps/locale/downloads/downloads.dtd"];
    return dtds;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} spec
   *        Information of the UI element which should be retrieved
   *        type: General type information
   *        subtype: Specific element or property
   *        value: Value of the element or property
   * @returns Element which has been created
   * @type {ElemBase}
   */
  getElement : function downloadManager_getElement(spec) {
    var elem = null;

    switch(spec.type) {
      /**
       * subtype: subtype of property to match
       * value: value of property to match
       */
      case "download":
        // Use a temporary lookup to get the download item
        var download = new elementslib.Lookup(this._controller.window.document,
                                              '/id("downloadManager")/id("downloadView")/' +
                                              '{"' + spec.subtype + '":"' + spec.value + '"}');
        this._controller.waitForElement(download, G_TIMEOUT);

        // Use its download id to construct the real lookup expression
        elem = new elementslib.Lookup(this._controller.window.document,
                                      '/id("downloadManager")/id("downloadView")/' +
                                      'id("' + download.getNode().getAttribute('id') + '")');
        break;

      /**
       * subtype: Identifier of the specified download button (cancel, pause, resume, retry)
       * value: Entry (download) of the download list
       */
      case "download_button":
        // XXX: Bug 555347 - There are outstanding events to process
        this._controller.sleep(0);

        elem = new elementslib.Lookup(this._controller.window.document, spec.value.expression +
                                      '/anon({"flex":"1"})/[1]/[1]/{"cmd":"cmd_' + spec.subtype + '"}');
        break;
      default:
        throw new Error(arguments.callee.name + ": Unknown element type - " + spec.type);
    }

    return elem;
  },

  /**
   * Get the download filenames from the Download Panel
   *
   * @param {MozMillController} aController MozMillController of the browser window
   * @returns {[String]} list of downloaded file names
   */
  getPanelDownloads : function downloadManager_getPanelDownloads(aController) {

    // Open the Panel
    var button = new elementslib.ID(aController.window.document, "downloads-indicator");
    aController.click(button);

    // Collect the downloads from the UI
    var nodeCollector = new domUtils.nodeCollector(aController.window.document.
                                                   getElementById("downloadsPanel"));
    var downloadIndicatorItems = nodeCollector.queryNodes("richlistitem").nodes;
    var downloadedFiles = downloadIndicatorItems.map(function (self) {
      return self.attributes["target"].value
    });

    // Close the panel
    aController.keypress(null, "VK_ESCAPE", {});

    return downloadedFiles;
  },

  /**
   * Open the Download Manager
   *
   * @param {MozMillController} controller
   *        MozMillController of the window to operate on
   * @param {boolean} shortcut
   *        If true the keyboard shortcut is used
   */
  open : function downloadManager_open(controller, shortcut) {
    if (shortcut) {
      if (mozmill.isLinux) {
        var cmdKey = utils.getEntity(this.getDtds(), "downloadsUnix.commandkey");
        controller.keypress(null, cmdKey, {ctrlKey: true, shiftKey: true});
      } else {
        var cmdKey = utils.getEntity(this.getDtds(), "downloads.commandkey");
        controller.keypress(null, cmdKey, {accelKey: true});
      }
    } else {
      controller.mainMenu.click("#menu_openDownloads");
    }

    controller.sleep(500);
    this.waitForOpened(controller);
  },

  /**
   * Retrieve the currently set Download Location
   * @return {string} aPath where the downloaded files are saved
   */
  get DownloadLocation() {
    return prefs.preferences.getPref(PREF_DOWNLOAD_DIR, "");
  },

  /**
   * Sets the Download Location
   * @param {string} aPath Where to save downloaded files
   *                       If null or invalid value will reset to default setting
   */
  set DownloadLocation(aPath) {
    prefs.preferences.setPref(PREF_DOWNLOAD_DIR, aPath);
    prefs.preferences.setPref(PREF_DOWNLOAD_FOLDERLIST, 2);
  },

  /**
   * Reset the Download Location
   * @return {string} aPath where the downloaded files are saved
   */
  resetDownloadLocation : function downloadManager_resetDownloadLocation() {
    prefs.preferences.clearUserPref(PREF_DOWNLOAD_DIR);
    prefs.preferences.clearUserPref(PREF_DOWNLOAD_FOLDERLIST);
  },

  /**
   * Wait for the given download state
   *
   * @param {MozMillController} controller
   *        MozMillController of the window to operate on
   * @param {downloadState} state
   *        Expected state of the download
   * @param {number} timeout
   *        Timeout for waiting for the download state (optional)
   */
  waitForDownloadState : function downloadManager_waitForDownloadState(download, state, timeout) {
    assert.waitFor(function () {
      return this.getDownloadState(download) === state;
    }, "Download state has been set. Expected '" + state + "'", undefined, undefined, this);
  },

  /**
   * Wait until the Download Manager has been opened
   *
   * @param {MozMillController} controller
   *        MozMillController of the window to operate on
   */
  waitForOpened : function downloadManager_waitForOpened(controller) {
    this._controller = utils.handleWindow("type", "Download:Manager",
                                          undefined, false);
  }
};

/**
 * Download the file of unkown type from the given location by saving it
 * automatically to disk
 *
 * @param {MozMillController} controller
 *        MozMillController of the browser window
 * @param {string} url
 *        URL of the file which has to be downloaded
 */
var downloadFileOfUnknownType = function(controller, url) {
  controller.open(url);

  // Wait until the unknown content type dialog has been opened
  assert.waitFor(function () {
    return mozmill.wm.getMostRecentWindow('').document.documentElement.id === 'unknownContentType';
  }, "Unknown content type dialog has been opened");

  utils.handleWindow("type", "", function (controller) {
    // If there is a Save File As radio, make sure it is selected
    var saveFileRadio = new elementslib.ID(controller.window.document, "save");
    if (saveFileRadio.getNode()) {
      controller.click(saveFileRadio);
      assert.waitFor(function () {
        return saveFileRadio.getNode().selected;
      }, "Save File radio button on the Download Unknown Type dialog has been selected");
    }

    // Wait until the OK button has been enabled and click on it
    var button = new elementslib.Lookup(controller.window.document,
                                        '/id("unknownContentType")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
    controller.waitForElement(button, G_TIMEOUT);
    assert.waitFor(function () {
      return !button.getNode().hasAttribute('disabled');
    }, "The OK button has been enabled");
    controller.click(button);
  });
}

/**
 * Get a local file from a native path or URL
 *
 * @param {string} aPathOrUrl
 *        Native path or URL of the file
 * @see http://mxr.mozilla.org/mozilla-central/source/toolkit/mozapps/downloads/content/downloads.js#1309
 */
function getLocalFileFromNativePathOrUrl(aPathOrUrl) {
  if (aPathOrUrl.substring(0,7) == "file://") {
    // if this is a URL, get the file from that
    const FILE_URL = Services.io.newURI(aPathOrUrl, null, null)
                                .QueryInterface(Ci.nsIFileURL);
    return FILE_URL.file.clone().QueryInterface(Ci.nsILocalFile);
  } else {
    // if it's a pathname, create the nsILocalFile directly
    var f = new nsLocalFile(aPathOrUrl);
    return f;
  }
}

// Export of variables
exports.downloadState = DOWNLOAD_STATE;

// Export of functions
exports.downloadFileOfUnknownType = downloadFileOfUnknownType;
exports.getLocalFileFromNativePathOrUrl = getLocalFileFromNativePathOrUrl;

// Export of classes
exports.downloadManager = downloadManager;
