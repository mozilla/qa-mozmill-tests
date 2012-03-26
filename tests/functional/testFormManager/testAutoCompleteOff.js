/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testAutoCompleteOff = function() {
  var url = "http://www.google.com/webhp?complete=1&hl=en";
  var searchTerm = "mozillazine";

  // Open the google homepage
  controller.open(url);
  controller.waitForPageLoad();

  // Search for mozillazine on google
  var searchField = new elementslib.Name(controller.tabs.activeTab, "q");
  var submitButton = new elementslib.Name(controller.tabs.activeTab, "btnG");

  controller.waitForElement(searchField);
  controller.type(searchField, searchTerm);
  controller.click(submitButton);

  // Go back to the search page
  controller.open(url);
  controller.waitForPageLoad();

  // Enter a part of the search term only
  controller.waitForElement(searchField, gTimeout);
  controller.type(searchField, searchTerm.substring(0, 3));
  controller.sleep(500);

  // Verify source autocomplete=off
  var popupAutoCompList = new elementslib.ID(controller.window.document, "PopupAutoComplete");
  controller.assertJSProperty(popupAutoCompList, "popupOpen", false);
}

/**
 * Map test functions to litmus tests
 */
// testAutoCompleteOff.meta = {litmusids : [9067]};
