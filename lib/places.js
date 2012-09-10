/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The ModalDialogAPI adds support for handling modal dialogs. It
 * has to be used e.g. for alert boxes and other commonDialog instances.
 *
 * @version 1.0.2
 */

// Include required modules
var utils = require("utils");

const gTimeout = 5000;

// Default bookmarks.html file lives in omni.jar, get via resource URI
const BOOKMARKS_RESOURCE = "resource:///defaults/profile/bookmarks.html";

// Bookmarks can take up to ten seconds to restore
const BOOKMARKS_TIMEOUT = 10000;

// Observer topics we need to watch to know whether we're finished
const TOPIC_BOOKMARKS_RESTORE_SUCCESS = "bookmarks-restore-success";

/**
 * Instance of the bookmark service to gain access to the bookmark API.
 *
 * @see http://mxr.mozilla.org/mozilla-central (nsINavBookmarksService.idl)
 */
var bookmarksService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].
                       getService(Ci.nsINavBookmarksService);

/**
 * Instance of the history service to gain access to the history API.
 *
 * @see http://mxr.mozilla.org/mozilla-central (nsINavHistoryService.idl)
 */
var historyService = Cc["@mozilla.org/browser/nav-history-service;1"].
                     getService(Ci.nsINavHistoryService);

/**
 * Instance of the livemark service to gain access to the livemark API
 *
 * @see http://mxr.mozilla.org/mozilla-central (nsILivemarkService.idl)
 */
var livemarkService = Cc["@mozilla.org/browser/livemark-service;2"].
                      getService(Ci.nsILivemarkService);

/**
 * Instance of the browser history interface to gain access to
 * browser-specific history API
 *
 * @see http://mxr.mozilla.org/mozilla-central (nsIBrowserHistory.idl)
 */
var browserHistory = Cc["@mozilla.org/browser/nav-history-service;1"].
                     getService(Ci.nsIBrowserHistory);

/**
 * Instance of the observer service to gain access to the observer API
 *
 * @see http://mxr.mozilla.org/mozilla-central (nsIObserverService.idl)
 */
var observerService = Cc["@mozilla.org/observer-service;1"].
                      getService(Ci.nsIObserverService);

/**
 * Check if an URI is bookmarked within the specified folder
 *
 * @param (nsIURI) uri
 *        URI of the bookmark
 * @param {String} folderId
 *        Folder in which the search has to take place
 * @return Returns if the URI exists in the given folder
 * @type Boolean
 */
function isBookmarkInFolder(uri, folderId)
{
  var ids = bookmarksService.getBookmarkIdsForURI(uri, {});
  for (let i = 0; i < ids.length; i++) {
    if (bookmarksService.getFolderIdForItem(ids[i]) == folderId)
      return true;
  }

  return false;
}

/**
 * Restore the default bookmarks for the current profile
 */
function restoreDefaultBookmarks() {
  // Set up the observer -- we're only checking for success here, so we'll simply
  // time out and throw on failure. It makes the code much clearer than handling
  // finished state and success state separately.
  var importSuccessful = false;
  var importObserver = {
    observe: function (aSubject, aTopic, aData) {
      if (aTopic == TOPIC_BOOKMARKS_RESTORE_SUCCESS) {
        importSuccessful = true;
      }
    }
  }
  observerService.addObserver(importObserver, TOPIC_BOOKMARKS_RESTORE_SUCCESS, false);

  try {
    // Fire off the import
    var bookmarksURI = utils.createURI(BOOKMARKS_RESOURCE);
    var importer = Cc["@mozilla.org/browser/places/import-export-service;1"].
                   getService(Ci.nsIPlacesImportExportService);
    importer.importHTMLFromURI(bookmarksURI, true);

    // Wait for it to be finished--the observer above will flip this flag
    mozmill.utils.waitFor(function () {
      return importSuccessful;
    }, "Default bookmarks have finished importing", BOOKMARKS_TIMEOUT);
  }
  finally {
    // Whatever happens, remove the observer afterwards
    observerService.removeObserver(importObserver, TOPIC_BOOKMARKS_RESTORE_SUCCESS);
  }
}

/**
 * Synchronous wrapper around browserHistory.removeAllPages()
 * Removes history and blocks until done
 */
function removeAllHistory() {
  const TOPIC_EXPIRATION_FINISHED = "places-expiration-finished";

  // Create flag visible to both the eval and the observer object
  var finishedFlag = {
    state: false
  }

  // Set up an observer so we get notified when remove completes
  let observer = {
    observe: function(aSubject, aTopic, aData) {
      observerService.removeObserver(this, TOPIC_EXPIRATION_FINISHED);
      finishedFlag.state = true;
    }
  }
  observerService.addObserver(observer, TOPIC_EXPIRATION_FINISHED, false);

  // Remove the pages, then block until we're done or until timeout is reached
  browserHistory.removeAllPages();
  mozmill.utils.waitFor(function () {
    return finishedFlag.state;
  }, "Browsing History has been cleared");
}

// Export of variables
exports.bookmarksService = bookmarksService;
exports.historyService = historyService;
exports.livemarkService = livemarkService;
exports.browserHistory = browserHistory;

// Export of functions
exports.isBookmarkInFolder = isBookmarkInFolder;
exports.restoreDefaultBookmarks = restoreDefaultBookmarks;
exports.removeAllHistory = removeAllHistory;
