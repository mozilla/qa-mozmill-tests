/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { expect } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.tabElement = aModule.tabBrowser.getTab(aModule.tabBrowser.selectedIndex);
  aModule.expression = aModule.tabBrowser.
                       getElement({type: "tabs_tabPanel", value: aModule.tabElement}).
                       expression;

  aModule.containerString = expression + '/anon({"class":"browserSidebarContainer"})' +
                            '/anon({"class":"browserContainer"})/[0]' +
                            '/anon({"anonid":"findbar-container"})' +
                            '/anon({"anonid":"findbar-textbox-wrapper"})';

  aModule.findBar = new elementslib.Lookup(aModule.controller.window.document,
                                           aModule.containerString);
  aModule.findBarTextField = new elementslib.Lookup(aModule.controller.window.document,
                                                    aModule.containerString +
                                                    '/anon({"anonid":"findbar-textbox"})');
  aModule.findBarNextButton = new elementslib.Lookup(aModule.controller.window.document,
                                                     aModule.containerString +
                                                     '/anon({"anonid":"find-next"})');
  aModule.findBarPrevButton = new elementslib.Lookup(aModule.controller.window.document,
                                                     aModule.containerString +
                                                     '/anon({"anonid":"find-previous"})');
  aModule.findBarCloseButton = new elementslib.Lookup(aModule.controller.window.document,
                                                      aModule.containerString +
                                                      '/anon({"anonid":"find-closebutton"})');
}

var teardownModule = function(aModule) {
  try {
     // Just press Ctrl/Cmd + F to select the whole search string
    var dtds = ["chrome://browser/locale/browser.dtd"];
    var cmdKey = utils.getEntity(dtds, "findOnCmd.commandkey");
    aModule.controller.keypress(null, cmdKey, {accelKey: true});

    // Clear search text from the text field
    aModule.controller.keypress(aModule.findBarTextField, 'VK_DELETE', {});

    // Make sure the find bar is closed by click the X button
    aModule.controller.click(aModule.findBarCloseButton);
  }
  catch(e) {
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
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Press Ctrl/Cmd + F to open the find bar
  var dtds = ["chrome://browser/locale/browser.dtd"];
  var cmdKey = utils.getEntity(dtds, "findOnCmd.commandkey");
  controller.keypress(null, cmdKey, {accelKey: true});

  // Check that the find bar is visible
  controller.waitForElement(findBar);

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

setupModule.__force_skip__ = "Bug 917771 - Test failure 'The next result has been " +
                             "selected - '0' should not equal '0''";
teardownModule.__force_skip__ = "Bug 917771 - Test failure 'The next result has been " +
                                "selected - '0' should not equal '0''";
