/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { expect } = require("../../../../lib/assertions");
var places = require("../../../../lib/places");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla_contribute.html";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.locationBar =  new toolbars.locationBar(aModule.controller);
}

var teardownModule = function(aModule) {
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

  // Bug 474486
  // Until we can't check via a menu click, call the Places API function for now
  var bookmarkFolder = places.bookmarksService.bookmarksMenuFolder;
  var bookmarkExists = places.isBookmarkInFolder(uri, bookmarkFolder);
  expect.ok(bookmarkExists, "Bookmark was created in the bookmarks menu");
}

