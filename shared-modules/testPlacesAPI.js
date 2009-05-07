/* * ***** BEGIN LICENSE BLOCK *****
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
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <hskupin@gmail.com>
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
 * **** END LICENSE BLOCK ***** */

var MODULE_NAME = 'PlacesAPI';

const Cc = Components.classes;
const Ci = Components.interfaces;

// Bookmark service
let bookmarks = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].
                getService(Ci.nsINavBookmarksService);

/**
 * Check if a URI is bookmarked within a given folder
 */
function isBookmarkInFolder( aURI, aFolderId) {
  let ids = bookmarks.getBookmarkIdsForURI(aURI, {});
  for (let i = 0; i < ids.length; i++) {
    if (bookmarks.getFolderIdForItem(ids[i]) == aFolderId)
      return true;
  }

  return false;
}

/**
 * Restore the default bookmarks by overwriting all existing entries
 */
function restoreDefaultBookmarks() {
  // Get the default bookmarks.html
  let dirService = Cc["@mozilla.org/file/directory_service;1"].
                   getService(Ci.nsIProperties);

  bookmarksFile = dirService.get("profDef", Ci.nsILocalFile);
  bookmarksFile.append("bookmarks.html");

  // Run the import
  let importer = Cc["@mozilla.org/browser/places/import-export-service;1"].
                 getService(Ci.nsIPlacesImportExportService);
  importer.importHTMLFromFile(bookmarksFile, true);
}
