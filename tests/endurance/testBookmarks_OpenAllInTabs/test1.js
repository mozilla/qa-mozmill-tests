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
 * The Initial Developer of the Original Code is Vlad Maniac.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Vlad Maniac <vmaniac@mozilla.com> (original author)
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
