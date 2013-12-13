/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var endurance = require("../../../lib/endurance");
var places = require("../../../../lib/places");
var tabs = require("../../../lib/tabs");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html?entity=";

const BOOKMARK_FOLDER_NAME = "testFolder";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);
  aModule.locationBar = new toolbars.locationBar(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();

  // Bookmark some pages in a custom folder
  setupBookmarks(aModule.controller);
}

function teardownModule(aModule) {
  toolbars.toggleBookmarksToolbar(aModule.controller, false);
  aModule.tabBrowser.closeAllTabs();
  places.restoreDefaultBookmarks();
}

/*
 * Test open all bookmarks one by one and close all
 */
function testOpenAndCloseAllBookmarks() {
  enduranceManager.run(function () {
    var testFolder = new elementslib.Selector(controller.window.document,
                                              "toolbarbutton.bookmark-item[label='" +
                                              BOOKMARK_FOLDER_NAME + "']");
    assert.waitFor(function () {
      return utils.isDisplayed(controller, testFolder);
    }, BOOKMARK_FOLDER_NAME + " has loaded")

    enduranceManager.loop(function () {
      if (enduranceManager.currentEntity > 1) {
        tabBrowser.openTab();
      }
      controller.click(testFolder);

      var bookmark = new elementslib.Selector(controller.window.document,
                                              "*[label='Test Bookmark " +
                                              enduranceManager.currentEntity + "']");

      controller.waitThenClick(bookmark);
      controller.waitForPageLoad();

      // Bug 780107
      // Mozmill does not dismiss dropdown menus after click
      controller.keypress(null , 'VK_ESCAPE', {});
      enduranceManager.addCheckpoint("Bookmark was opened");
    });

    tabBrowser.closeAllTabs();
  });
}

/*
 * Insert bookmarks in a custom folder under Bookmarks Toolbar
 */
function setupBookmarks(aController) {
  toolbars.toggleBookmarksToolbar(aController, true);

  // Create a custom folder in Bookmarks Toolbar
  var toolbarFolder = places.bookmarksService.toolbarFolder;
  var defaultIndex = places.bookmarksService.DEFAULT_INDEX;
  var customFolder = places.bookmarksService.createFolder(toolbarFolder,
                                                          BOOKMARK_FOLDER_NAME,
                                                          defaultIndex);

  for (var i = 1; i <= enduranceManager.entities; i++) {
    var URI = utils.createURI(TEST_DATA + i);

    // Bookmark page and save in a custom folder
    places.bookmarksService.insertBookmark(customFolder, URI, defaultIndex,
                                           "Test Bookmark " + i);

    // Polling the bookmarks service if such a bookmark has been added
    assert.waitFor(function () {
      return places.bookmarksService.isBookmarked(URI);
    }, "The bookmark was created");
  }
}
