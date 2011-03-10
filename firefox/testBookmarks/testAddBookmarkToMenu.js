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
 *   Aaron Train <atrain@mozilla.com>
 *   Geo Mealer <gmealer@mozilla.com>
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

// Include required modules
var places = require("../../lib/places");
var utils = require("../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla_contribute.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();
}

var teardownModule = function() {
  places.restoreDefaultBookmarks();
}

var testAddBookmarkToBookmarksMenu = function() {
  var uri = utils.createURI(LOCAL_TEST_PAGE);

  // Fail if the URI is already bookmarked
  controller.assertJS("subject.isBookmarked == false", {
    isBookmarked: places.bookmarksService.isBookmarked(uri)
  });

  // Open URI and wait until it has been finished loading
  controller.open(uri.spec);
  controller.waitForPageLoad();

  // Open the bookmark panel via bookmarks menu
  var bookmarkMenuItem = new elementslib.Elem(controller.menus.bookmarksMenu.
                                              menu_bookmarkThisPage);
  controller.click(bookmarkMenuItem);

  // editBookmarksPanel is loaded lazily. Wait until overlay for StarUI has been loaded
  controller.waitForEval("subject._overlayLoaded == true", TIMEOUT, 100, 
                         controller.window.top.StarUI);

  // Bookmark should automatically be stored under the Bookmark Menu
  var nameField = new elementslib.ID(controller.window.document, 
                                     "editBMPanel_namePicker");
  var doneButton = new elementslib.ID(controller.window.document, 
                                      "editBookmarkPanelDoneButton");

  controller.type(nameField, "Mozilla");
  controller.click(doneButton);

  // Check if bookmark was created in the Bookmarks Menu
  // XXX: Until we can't check via a menu click, call the Places API function for now (bug 474486)
  controller.assertJS("subject.isBookmarkInBookmarksMenu == true", {
    isBookmarkInBookmarksMenu: 
      places.isBookmarkInFolder(uri, places.bookmarksService.bookmarksMenuFolder)
  });
}

/**
 * Map test functions to litmus tests
 */
// testAddBookmarkToBookmarksMenu.meta = {litmusids : [8154]};
