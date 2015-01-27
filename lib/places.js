/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The ModalDialogAPI adds support for handling modal dialogs. It
 * has to be used e.g. for alert boxes and other commonDialog instances.
 */

// Include required modules
var { assert } = require("assertions");

Cu.import("resource://gre/modules/BookmarkHTMLUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

// Default bookmarks.html file lives in omni.jar, get via resource URI
const BOOKMARKS_RESOURCE = "resource:///defaults/profile/bookmarks.html";

// Bookmarks and History can take up to ten seconds to restore/clear
const BOOKMARKS_TIMEOUT = 10000;
const HISTORY_TIMEOUT = 10000;

/**
 * Instance of the bookmark service to gain access to the bookmark API.
 *
 * @see http://mxr.mozilla.org/mozilla-central (nsINavBookmarksService.idl)
 */
var bookmarksService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
                       .getService(Ci.nsINavBookmarksService);

/**
 * Instance of the history service to gain access to the history API.
 *
 * @see http://mxr.mozilla.org/mozilla-central (nsINavHistoryService.idl)
 */
var historyService = Cc["@mozilla.org/browser/nav-history-service;1"]
                     .getService(Ci.nsINavHistoryService);

/**
 * Instance of the browser history interface to gain access to
 * browser-specific history API
 *
 * @see http://mxr.mozilla.org/mozilla-central (nsIBrowserHistory.idl)
 */
var browserHistory = Cc["@mozilla.org/browser/nav-history-service;1"]
                     .getService(Ci.nsIBrowserHistory);

/**
 * Clears the Flash cookies
 */
function clearPluginData() {
  const FLAG_CLEAR_ALL = Ci.nsIPluginHost.FLAG_CLEAR_ALL;

  var ph = Cc["@mozilla.org/plugin/host;1"].getService(Ci.nsIPluginHost);
  var tags = ph.getPluginTags();

  tags.forEach(function (aTag) {
    try {
      ph.clearSiteData(aTag, null, FLAG_CLEAR_ALL, -1);
    }
    catch (ex) {}
  });
}

/**
 * Check if an URI is bookmarked within the specified folder
 *
 * @param (nsIURI) aUri
 *        URI of the bookmark
 * @param {String} aFolderId
 *        Folder in which the search has to take place
 * @return Returns if the URI exists in the given folder
 * @type Boolean
 */
function isBookmarkInFolder(aUri, aFolderId) {
  var ids = bookmarksService.getBookmarkIdsForURI(aUri, {});
  for (let i = 0; i < ids.length; i++) {
    if (bookmarksService.getFolderIdForItem(ids[i]) == aFolderId)
      return true;
  }

  return false;
}

/**
 * Check if the status of the star-button has been updated
 */
function isBookmarkStarButtonReady(aController) {
  var bookmarksButton = aController.window.BookmarkingUI;
  return bookmarksButton.status !== bookmarksButton.STATUS_UPDATING;
}

/**
 * Restore the default bookmarks for the current profile
 */
function restoreDefaultBookmarks() {
  const TOPIC_BOOKMARKS_RESTORE_SUCCESS = "bookmarks-restore-success";

  var importSuccessful = false;
  var observer = {
    observe: function(aSubject, aTopic, aData) {
      importSuccessful = true;
    }
  }

  // Fire off the import and ensure we do an initially import
  try {
    Services.obs.addObserver(observer, TOPIC_BOOKMARKS_RESTORE_SUCCESS, false);

    BookmarkHTMLUtils.importFromURL(BOOKMARKS_RESOURCE, true);

    // Wait for it to be finished
    assert.waitFor(function () {
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
    assert.waitFor(function () {
      return finishedStateFlag;
    }, "Browsing History has been cleared", HISTORY_TIMEOUT);
  }
  finally {
    Services.obs.removeObserver(observer, TOPIC_EXPIRATION_FINISHED);
  }
}

/**
 * Initiates an onVisit listener for the historyService observer
 *
 * @param {(string|string[])} aURLs
 *        URL or array of URLs to listen for changes to the history
 * @param {function} aCallback
 *        Callback for adding URLs to the history
 */
function waitForVisited(aURLs, aCallback) {
  assert.equal(typeof aCallback, "function", "Callback has been specified");
  assert.ok(aURLs, "URLs have been specified");

  var URLs = (typeof aURLs === "string") ? [aURLs] : aURLs;

  // Initialize visited URLs object
  var visitedURLs = {};

  URLs.forEach(aURL => {
    visitedURLs[aURL] = false;
  });

  var visitObserver = {
    onVisit : function (aURI) {
      visitedURLs[aURI.spec] = true;
    }
  };

  historyService.addObserver(visitObserver, false);

  try {
    aCallback();

    // Check if all required URLs have been added to the history
    assert.waitFor(() =>
      URLs.every(aURL => {
        return visitedURLs[aURL];
      }), "All pages have been visited", HISTORY_TIMEOUT);
  }
  finally {
    historyService.removeObserver(visitObserver);
  }
}

// Export of variables
exports.bookmarksService = bookmarksService;
exports.historyService = historyService;
exports.browserHistory = browserHistory;

// Export of functions
exports.clearPluginData = clearPluginData;
exports.isBookmarkInFolder = isBookmarkInFolder;
exports.isBookmarkStarButtonReady = isBookmarkStarButtonReady;
exports.restoreDefaultBookmarks = restoreDefaultBookmarks;
exports.removeAllHistory = removeAllHistory;
exports.waitForVisited = waitForVisited;
