/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var endurance = require("../../../lib/endurance");
var places = require("../../../lib/places");
var tabs = require("../../../lib/tabs");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html?entity=';

const BOOKMARK_FOLDER_NAME = "testFolder";

function setupModule() {
  controller = mozmill.getBrowserController();

  enduranceManager = new endurance.EnduranceManager(controller);
  locationBar = new toolbars.locationBar(controller);
  tabBrowser = new tabs.tabBrowser(controller);

  tabBrowser.closeAllTabs();

  // Bookmark some pages in a custom folder
  setupBookmarks(controller);
}

function teardownModule() {
  tabBrowser.closeAllTabs();
  places.restoreDefaultBookmarks();
}

/* 
 * Test open all bookmarks one by one and close all
 */
function testOpenAndCloseAllBookmarks() {
  enduranceManager.run(function () {
    var testFolder = new elementslib.Selector(controller.window.document,
                                              ".bookmark-item[label='" +
                                              BOOKMARK_FOLDER_NAME + "']");

    enduranceManager.loop(function () {
      if (enduranceManager.currentEntity > 1) {
        tabBrowser.openTab();
      }
      controller.waitThenClick(testFolder);

      var bookmark = new elementslib.Selector(controller.window.document,
                                              "*[label='Test Bookmark " +
                                              enduranceManager.currentEntity + "']");

      controller.click(bookmark);
      controller.waitForPageLoad();

      // XXX: Bug 780107
      //      Mozmill does not dismiss dropdown menus after click
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
  toolbars.enableBookmarksToolbar(aController);

  // Create a custom folder in Bookmarks Toolbar
  var toolbarFolder = places.bookmarksService.toolbarFolder;
  var defaultIndex = places.bookmarksService.DEFAULT_INDEX;
  var customFolder = places.bookmarksService.createFolder(toolbarFolder,
                                                          BOOKMARK_FOLDER_NAME,
                                                          defaultIndex);

  for (var i = 1; i <= enduranceManager.entities; i++) {
    var URI = utils.createURI(LOCAL_TEST_PAGE + i);

    // Bookmark page and save in a custom folder
    places.bookmarksService.insertBookmark(customFolder, URI, defaultIndex,  
                                           "Test Bookmark " + i);

    // Polling the bookmarks service if such a bookmark has been added
    aController.waitFor(function () {
      return places.bookmarksService.isBookmarked(URI);
    }, "The bookmark was created");
  }
}
