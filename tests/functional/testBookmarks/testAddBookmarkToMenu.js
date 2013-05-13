/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { expect } = require("../../../lib/assertions");
var places = require("../../../lib/places");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla_contribute.html";

var setupModule = function() {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);
}

var teardownModule = function() {
  places.restoreDefaultBookmarks();
}

var testAddBookmarkToBookmarksMenu = function() {
  var uri = utils.createURI(TEST_DATA);

  // Open URI and wait until it has been finished loading
  controller.open(uri.spec);
  controller.waitForPageLoad();

  // Open the bookmark panel via bookmarks menu
  controller.mainMenu.click("#menu_bookmarkThisPage");

  // editBookmarksPanel is loaded lazily. Wait until overlay for StarUI has been loaded
  locationBar.editBookmarksPanel.waitForPanel();

  // Bookmark should automatically be stored under the Bookmark Menu
  var nameField = locationBar.editBookmarksPanel.getElement({type: "nameField"});
  var doneButton = locationBar.editBookmarksPanel.getElement({type: "doneButton"});

  controller.type(nameField, "Mozilla");
  controller.click(doneButton);

  // XXX: Until we can't check via a menu click, call the Places API function for now (bug 474486)
  var bookmarkFolder = places.bookmarksService.bookmarksMenuFolder;
  var bookmarkExists = places.isBookmarkInFolder(uri, bookmarkFolder);
  expect.ok(bookmarkExists, "Bookmark was created in the bookmarks menu");
}

/**
 * Map test functions to litmus tests
 */
// testAddBookmarkToBookmarksMenu.meta = {litmusids : [8154]};
