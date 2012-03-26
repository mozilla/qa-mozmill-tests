/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla.html', id: 'community'},
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla_mission.html', id: 'mission_statement'},
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla_grants.html', id: 'accessibility'} 
];

var setupModule = function() {
  controller = mozmill.getBrowserController();
}

/**
 * Test the back and forward buttons
 */
var testBackAndForward = function() {
  var backButton = new elementslib.ID(controller.window.document, "back-button");
  var forwardButton = new elementslib.ID(controller.window.document, "forward-button");
  
  // Open up the list of local pages statically assigned in the array
  for each (var localPage in LOCAL_TEST_PAGES) {
    controller.open(localPage.url);
    controller.waitForPageLoad();
   
    var element = new elementslib.ID(controller.tabs.activeTab, localPage.id);
    controller.assertNode(element);
  }

  // Click on the Back button for the number of local pages visited
  for (var i = LOCAL_TEST_PAGES.length - 2; i >= 0; i--) {
    controller.click(backButton);

    var element = new elementslib.ID(controller.tabs.activeTab, LOCAL_TEST_PAGES[i].id);
    controller.waitForElement(element, TIMEOUT);
  }

  // Click on the Forward button for the number of websites visited
  for (var j = 1; j < LOCAL_TEST_PAGES.length; j++) {
    controller.click(forwardButton);

    var element = new elementslib.ID(controller.tabs.activeTab, LOCAL_TEST_PAGES[j].id);
    controller.waitForElement(element, TIMEOUT);
  }
}

// Bug 704140 - Failure in /testToolbar/testBackForwardButtons.js | 
//              Timeout waiting for element with id mission_statement
setupModule.__force_skip__ = "Bug 704140 - Failure in /testToolbar/" +
                             "testBackForwardButtons.js | " +
                             "Timeout waiting for element with id mission_statement";
