/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var endurance = require("../../../lib/endurance");
var places = require("../../../lib/places");
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html?entity=';

const PREF_TAB_NUMBER_WARNING = "browser.tabs.maxOpenBeforeWarn";

function setupModule() {
  controller = mozmill.getBrowserController();

  enduranceManager = new endurance.EnduranceManager(controller);
  tabBrowser = new tabs.tabBrowser(controller);

  // Do not warn about max opened tab number
  prefs.preferences.setPref(PREF_TAB_NUMBER_WARNING,
                            enduranceManager.entities + 1);

  // Bookmark some pages in a custom folder
  setupBookmarks();

}

function teardownModule() {
  tabBrowser.closeAllTabs();
  places.restoreDefaultBookmarks();
}

/*
 * Test open all bookmarks in tabs
 */
function testOpenAllBookmarksInTabs() {
  enduranceManager.run(function () {
    tabBrowser.closeAllTabs();

    var testFolder = new elementslib.Selector(controller.window.document,
                                              ".bookmark-item[label='Test Folder']");
    controller.waitForElement(testFolder);
    controller.rightClick(testFolder);

    var openAllInTabs = new elementslib.ID(controller.window.document,
                                           "placesContext_openContainer:tabs");

    controller.click(openAllInTabs);
    controller.waitForPageLoad();

    // Dismiss the context menu
    controller.keypress(null , 'VK_ESCAPE', {});
  });
}

/*
 * Insert bookmarks in a custom folder under Bookmarks Toolbar
 */
function setupBookmarks() {
  // Enable bookmarks toolbar
  var navbar = new elementslib.ID(controller.window.document, "nav-bar");

  controller.rightClick(navbar, navbar.getNode().boxObject.width / 2, 2);

  var toggle = new elementslib.ID(controller.window.document,
                                  "toggle_PersonalToolbar");
  controller.mouseDown(toggle);
  controller.mouseUp(toggle);

  // Create a custom folder in Bookmarks Toolbar
  var toolbarFolder = places.bookmarksService.toolbarFolder;
  var defaultIndex = places.bookmarksService.DEFAULT_INDEX;
  var customFolder = places.bookmarksService.createFolder(toolbarFolder,
                                                          "Test Folder",
                                                          defaultIndex);

  for (var i = 0; i < enduranceManager.entities; i++) {
    var URI = utils.createURI(LOCAL_TEST_PAGE + i);

    // Bookmark page and save in a custom folder
    places.bookmarksService.insertBookmark(customFolder, URI, defaultIndex,
                                           "Test Bookmark " +
                                           enduranceManager.currentEntity);

    // Polling the bookmarks service if such a bookmark has been added
    controller.waitFor(function () {
      return places.bookmarksService.isBookmarked(URI);
    }, "The bookmark was created");
  }
}
