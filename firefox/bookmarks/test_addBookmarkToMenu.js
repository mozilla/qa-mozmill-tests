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

var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);
var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['placesAPI', 'utilsAPI'];

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();

  module.places = collector.getModule('placesAPI');
  module.utils = collector.getModule('utilsAPI');
}

var teardownModule = function(module) {
  //places.restoreDefaultBookmarks();
}

/**
 *  Testcase ID #5954 - Add a bookmark via Main Menu
 */
var testAddBookmarkToBookmarksMenu = function() {
  var uri = utils.createURI("http://www.mozilla.org");

  // Fail if the URI is already bookmarked
  if (places.bookmarks.isBookmarked(uri))
    throw "Failed: " + uri.spec + " is already bookmarked.";

  // Open URI and wait until it has been finished loading
  controller.open(uri.spec);
  controller.waitForPageLoad(controller.tabs.activeTab);

  // Open the bookmark panel via bookmarks menu
  controller.click(new elementslib.Elem(controller.menus.bookmarksMenu.menu_bookmarkThisPage));

  // editBookmarksPanel is loaded lazily. Wait until overlay for StarUI has been loaded
  controller.waitForEval("subject._overlayLoaded == true", 2000, 100, controller.window.top.StarUI);

  // Bookmark should automatically be stored under the Bookmark Menu
  // XXX: We should give a unique name too when controller.type will send oninput events (bug 474667)
  controller.type(new elementslib.ID(controller.window.document, "editBMPanel_namePicker"),"Mozilla");
  controller.sleep(500);
  controller.click(new elementslib.ID(controller.window.document, "editBookmarkPanelDoneButton"));

  // Check if bookmark was created in the Bookmarks Menu
  // XXX: Until we can't check via a menu click, call the Places API function for now (bug 474486)
  if (!places.isBookmarkInFolder(uri, places.bookmarks.bookmarksMenuFolder))
    throw "Failed: Bookmark for " + uri.spec + " not added to Bookmarks Menu";
}
