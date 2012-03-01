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
 * Portions created by the Initial Developer are Copyright (C) 2012
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