/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var places = require("../../../lib/places");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla_contribute.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);
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
  locationBar.editBookmarksPanel.waitForPanel();

  // Bookmark should automatically be stored under the Bookmark Menu
  var nameField = locationBar.editBookmarksPanel.getElement({type: "nameField"});
  var doneButton = locationBar.editBookmarksPanel.getElement({type: "doneButton"});

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
