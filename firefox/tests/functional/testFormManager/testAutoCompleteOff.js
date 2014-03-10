/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var { expect } = require("../../../../lib/assertions");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "form_manager/autocomplete.html";

const SEARCH_TERM = "mozillazine";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

/**
 * Tests that no auto-complete entries are shown if turned off
 */
var testAutoCompleteOff = function() {
  controller.open(TEST_DATA);
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
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Enter a part of the search term only
  controller.waitForElement(searchField);
  controller.type(searchField, SEARCH_TERM.substring(0, 3));
  controller.sleep(500);

  var popupAutoCompList = new elementslib.ID(controller.window.document,
                                             "PopupAutoComplete");
  expect.ok(!popupAutoCompList.getNode().popupOpen, "Auto-complete popup is not visible");
}
