/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {assert} = require("../../../lib/assertions"); 
var endurance = require("../../../lib/endurance");
var places = require("../../../lib/places");
var tabs = require("../../../lib/tabs");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla_contribute.html';

function setupModule() {
  controller = mozmill.getBrowserController();

  enduranceManager = new endurance.EnduranceManager(controller);
  locationBar = new toolbars.locationBar(controller);
  tabBrowser = new tabs.tabBrowser(controller);
  
  // Open test page and wait until it has been finished loading
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();
}

function teardownModule() {
  places.restoreDefaultBookmarks();
  tabBrowser.closeAllTabs();
}

/**
* Test add and remove bookmark via awesomebar
*/
function testAddRemoveBookmarkViaAwesomeBar() {
  enduranceManager.run(function () {
    // Bookmark the page via the awesome bar star button
    var starButton = locationBar.getElement({type: "starButton"});
    var URI = utils.createURI(LOCAL_TEST_PAGE);

    controller.click(starButton); 

    // Wait for the bookmark event
    controller.waitFor(function () {
      return places.bookmarksService.isBookmarked(URI);
    }, "The bookmark was created");

    enduranceManager.addCheckpoint("Bookmark added via the Awesomebar");

    // Trigger editBookmarksPanel and remove bookmark
    controller.click(starButton);
    locationBar.editBookmarksPanel.waitForPanel();
  
    var removeBookmark = locationBar.editBookmarksPanel.getElement({type: "removeButton"});

    controller.click(removeBookmark); 

    // Verify the bookmark was removed
    assert.ok(!places.bookmarksService.isBookmarked(URI), "The bookmark was removed");

    enduranceManager.addCheckpoint("Bookmark has been removed");
  });
}
