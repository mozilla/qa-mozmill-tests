/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { expect } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.findBar = aModule.tabBrowser.findBar;
}

var teardownModule = function(aModule) {
  aModule.findBar.value = "";
  aModule.findBar.close(true);
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
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  findBar.open();
  findBar.search(searchTerm);

  // Check that some text on the page has been highlighted
  // (Lower case because we aren't checking for Match Case option)
  var selectedText = tabContent.getSelection();
  expect.equal(selectedText.toString().toLowerCase(), searchTerm,
               "The text on the page has been highlighted");

  // Remember DOM range of first search result
  var range = selectedText.getRangeAt(0);

  // Click the next button and check the strings again
  findBar.findNext();

  selectedText = tabContent.getSelection();
  expect.equal(selectedText.toString().toLowerCase(), searchTerm,
               "The next search term has been highlighted");

  // Find the relative position of the next result
  var resultPosition = selectedText.getRangeAt(0).compareBoundaryPoints(comparator, range);
  expect.notEqual(resultPosition, 0, "The next result has been selected");

  // Click the prev button and check the strings again
  findBar.findPrevious();

  selectedText = tabContent.getSelection();
  expect.equal(selectedText.toString().toLowerCase(), searchTerm,
               "The previous search term has been highlighted");

  resultPosition = selectedText.getRangeAt(0).compareBoundaryPoints(comparator, range);
  expect.equal(resultPosition, 0, "The first result has been selected again");
}
