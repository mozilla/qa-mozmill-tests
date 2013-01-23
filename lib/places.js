/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The ModalDialogAPI adds support for handling modal dialogs. It
 * has to be used e.g. for alert boxes and other commonDialog instances.
 */

Components.utils.import("resource://gre/modules/BookmarkHTMLUtils.jsm");
Components.utils.import("resource://gre/modules/Services.jsm");

// Default bookmarks.html file lives in omni.jar, get via resource URI
const BOOKMARKS_RESOURCE = "resource:///defaults/profile/bookmarks.html";

// Bookmarks can take up to ten seconds to restore
const BOOKMARKS_TIMEOUT = 10000;


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
 * Get the _pendingStmt value to verify if we can click on the star-button element
 */
function isBookmarkStarButtonReady(aController) {
  return !aController.window.PlacesStarButton._pendingStmt;
}

/**
 * Restore the default bookmarks for the current profile
 */
function restoreDefaultBookmarks() {
  const TOPIC_BOOKMARKS_RESTORE_SUCCESS = "bookmarks-restore-success";

  var importSuccessful = false;
  var observer = {
    observe: function (aSubject, aTopic, aData) {
      importSuccessful = true;
    }
  }

  try {
    Services.obs.addObserver(observer, TOPIC_BOOKMARKS_RESTORE_SUCCESS, false);

    // Fire off the import and ensure we do an initially import
    BookmarkHTMLUtils.importFromURL(BOOKMARKS_RESOURCE, true);

    mozmill.utils.waitFor(function () {
      return importSuccessful;
    }, "Default bookmarks have been imported", BOOKMARKS_TIMEOUT);
  }
  finally {
    Services.obs.removeObserver(observer, TOPIC_BOOKMARKS_RESTORE_SUCCESS);
  }
 }

/**
 * Synchronous wrapper around browserHistory.removeAllPages()
 * Removes history and blocks until done
 */
function removeAllHistory() {
  const TOPIC_EXPIRATION_FINISHED = "places-expiration-finished";

  // Set up an observer and a flag so we get notified when remove completes
  var finishedStateFlag = false;
  var observer = {
    observe: function (aSubject, aTopic, aData) {
      finishedStateFlag = true;
    }
  }

  try {
    Services.obs.addObserver(observer, TOPIC_EXPIRATION_FINISHED, false);

    // Remove the pages, then block until we're done or until timeout is reached
    browserHistory.removeAllPages();
    mozmill.utils.waitFor(function () {
      return finishedStateFlag;
    }, "Browsing History has been cleared");
  }
  finally {
    Services.obs.removeObserver(observer, TOPIC_EXPIRATION_FINISHED);
  }
}

// Export of variables
exports.bookmarksService = bookmarksService;
exports.historyService = historyService;
exports.livemarkService = livemarkService;
exports.browserHistory = browserHistory;

// Export of functions
exports.isBookmarkInFolder = isBookmarkInFolder;
exports.isBookmarkStarButtonReady = isBookmarkStarButtonReady;
exports.restoreDefaultBookmarks = restoreDefaultBookmarks;
exports.removeAllHistory = removeAllHistory;
