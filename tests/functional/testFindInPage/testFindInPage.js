/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { expect } = require("../../../lib/assertions");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();

  containerString = '/id("main-window")/id("tab-view-deck")/[0]' +
                    '/id("browser-bottombox")/id("FindToolbar")' +
                    '/anon({"anonid":"findbar-container"})';
  findBar = new elementslib.Lookup(controller.window.document, containerString);
  findBarTextField = new elementslib.Lookup(controller.window.document,
                                            containerString + '/anon({"anonid":"findbar-textbox"})');
  findBarNextButton = new elementslib.Lookup(controller.window.document,
                                             containerString + '/anon({"anonid":"find-next"})');
  findBarPrevButton = new elementslib.Lookup(controller.window.document,
                                             containerString + '/anon({"anonid":"find-previous"})');
  findBarCloseButton = new elementslib.Lookup(controller.window.document,
                                              containerString + '/anon({"anonid":"find-closebutton"})');
}

var teardownModule = function(module) {
  try {
     // Just press Ctrl/Cmd + F to select the whole search string
    var dtds = ["chrome://browser/locale/browser.dtd"];
    var cmdKey = utils.getEntity(dtds, "findOnCmd.commandkey");
    controller.keypress(null, cmdKey, {accelKey: true});

    // Clear search text from the text field
    controller.keypress(findBarTextField, 'VK_DELETE', {});

    // Make sure the find bar is closed by click the X button
    controller.click(findBarCloseButton);
  } catch(e) {
  }
}

/**
 * Test find in page functionality
 *
 */
var testFindInPage = function() {
  var searchTerm = "community";
  var comparator = Ci.nsIDOMRange.START_TO_START;
  var tabContent = controller.tabs.activeTabWindow;

  // Open a local page
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  // Press Ctrl/Cmd + F to open the find bar
  var dtds = ["chrome://browser/locale/browser.dtd"];
  var cmdKey = utils.getEntity(dtds, "findOnCmd.commandkey");
  controller.keypress(null, cmdKey, {accelKey: true});

  // Check that the find bar is visible
  controller.waitForElement(findBar, TIMEOUT);

  // Type "community" into the find bar text field and press return to start the search
  controller.type(findBarTextField, searchTerm);
  controller.keypress(null, "VK_RETURN", {});

  // Check that some text on the page has been highlighted
  // (Lower case because we aren't checking for Match Case option)
  var selectedText = tabContent.getSelection();
  expect.equal(selectedText.toString().toLowerCase(), searchTerm,
               "The text on the page has been highlighted");

  // Remember DOM range of first search result
  var range = selectedText.getRangeAt(0);

  // Click the next button and check the strings again
  controller.click(findBarNextButton);

  selectedText = tabContent.getSelection();
  expect.equal(selectedText.toString().toLowerCase(), searchTerm,
               "The next search term has been highlighted");

  // Find the relative position of the next result
  var resultPosition = selectedText.getRangeAt(0).compareBoundaryPoints(comparator, range);
  expect.notEqual(resultPosition, 0, "The next result has been selected");

  // Click the prev button and check the strings again
  controller.click(findBarPrevButton);

  selectedText = tabContent.getSelection();
  expect.equal(selectedText.toString().toLowerCase(), searchTerm,
               "The previous search term has been highlighted");

  resultPosition = selectedText.getRangeAt(0).compareBoundaryPoints(comparator, range);
  expect.equal(resultPosition, 0, "The first result has been selected again");
}

/**
 * Map test functions to litmus tests
 */
// testFindInPage.meta = {litmusids : [7970]};
