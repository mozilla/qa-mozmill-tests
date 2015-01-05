/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var endurance = require("../../../../lib/endurance");
var places = require("../../../../lib/places");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html?entity=";

const PREF_TAB_NUMBER_WARNING = "browser.tabs.maxOpenBeforeWarn";

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.navBar = aModule.browserWindow.navBar;

  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  // Do not warn about max opened tab number
  prefs.setPref(PREF_TAB_NUMBER_WARNING,
                aModule.enduranceManager.entities + 1);

  // Bookmark some pages in a custom folder
  setupBookmarks();

}

function teardownModule(aModule) {
  aModule.tabBrowser.closeAllTabs();

  aModule.navBar.toggleBookmarksToolbar(false);

  // Bug 839996
  // This is a workaround for moment since there is no event to wait for before
  // restoring bookmarks
  aModule.controller.sleep(500);
  places.restoreDefaultBookmarks();
}

/*
 * Test open all bookmarks in tabs
 */
function testOpenAllBookmarksInTabs() {
  var testFolder = new elementslib.Selector(controller.window.document,
                                            "toolbarbutton.bookmark-item[label='Test Folder']");
  controller.waitForElement(testFolder);

  enduranceManager.run(function () {
    tabBrowser.closeAllTabs();

    var contextMenu = controller.getMenu("#placesContext");
    contextMenu.select("#placesContext_openContainer\\:tabs", testFolder);
    controller.waitForPageLoad();

    // Dismiss the context menu
    controller.keypress(null , 'VK_ESCAPE', {});
  });
}

/*
 * Insert bookmarks in a custom folder under Bookmarks Toolbar
 */
function setupBookmarks() {
  navBar.toggleBookmarksToolbar(true);

  // Create a custom folder in Bookmarks Toolbar
  var toolbarFolder = places.bookmarksService.toolbarFolder;
  var defaultIndex = places.bookmarksService.DEFAULT_INDEX;
  var customFolder = places.bookmarksService.createFolder(toolbarFolder,
                                                          "Test Folder",
                                                          defaultIndex);

  for (var i = 0; i < enduranceManager.entities; i++) {
    var URI = utils.createURI(TEST_DATA + i);

    // Bookmark page and save in a custom folder
    places.bookmarksService.insertBookmark(customFolder, URI, defaultIndex,
                                           "Test Bookmark " +
                                           enduranceManager.currentEntity);

    // Polling the bookmarks service if such a bookmark has been added
    assert.waitFor(function () {
      return places.bookmarksService.isBookmarked(URI);
    }, "The bookmark was created");
  }
}
