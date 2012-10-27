/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { expect } = require("../../../lib/assertions");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'form_manager/autocomplete.html';

const SEARCH_TERM = "mozillazine";

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

/**
 * Tests that no auto-complete entries are shown if turned off
 */
var testAutoCompleteOff = function() {
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var searchField = new elementslib.ID(controller.tabs.activeTab, "search");
  var submitButton = new elementslib.ID(controller.tabs.activeTab, "submit");

  controller.waitForElement(searchField);
  controller.type(searchField, SEARCH_TERM);

  controller.click(submitButton);
  controller.waitForPageLoad();

  var searchTerm = new elementslib.ID(controller.tabs.activeTab, "term");
  expect.equal(searchTerm.getNode().innerHTML, SEARCH_TERM,
               "Search for the given search term happened.");

  // Go back to the search page
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  // Enter a part of the search term only
  controller.waitForElement(searchField);
  controller.type(searchField, SEARCH_TERM.substring(0, 3));
  controller.sleep(500);

  // Verify source autocomplete=off
  var popupAutoCompList = new elementslib.ID(controller.window.document,
                                             "PopupAutoComplete");
  controller.assertJSProperty(popupAutoCompList, "popupOpen", false);
}

/**
 * Map test functions to litmus tests
 */
// testAutoCompleteOff.meta = {litmusids : [9067]};
