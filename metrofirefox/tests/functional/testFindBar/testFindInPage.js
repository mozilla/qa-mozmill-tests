/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var { assert } = require("../../../../lib/assertions");
var toolbars = require("../../../lib/ui/toolbars");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla_community.html";

const SEARCH_TEXT = "community";

const PREF_FIND_CASESENSITIVE = "accessibility.typeaheadfind.casesensitive";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.toolBar = new toolbars.ToolBar(aModule.controller);
}

function teardownModule(aModule) {
  toolBar.findBar.close({force: true});
}

/**
 * Bug 879382: Test find in page functionality
 */
function testFindInPage() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  toolBar.findBar.open();

  // Do a search
  toolBar.findBar.type(SEARCH_TEXT);

  // Check that the correct word has been highlighted
  var selectedText;
  assert.waitFor(function () {
    selectedText = toolBar.findBar.getSelection();
    return selectedText.toString().toLowerCase() === SEARCH_TEXT;
  }, "Text has been selected");

  var firstSelection = selectedText.getRangeAt(0).startOffset;

  // Check that the next occurence has been highlighted
  selectedText = toolBar.findBar.findNext();
  assert.waitFor(function () {
    var secondSelection = selectedText.getRangeAt(0).startOffset;
    return secondSelection !== firstSelection;
  }, "Next occurence of the text has been selected");

  assert.equal(selectedText.toString().toLowerCase(), SEARCH_TEXT,
               "The correct text has been selected");

  // Check that the first selection has been reselected
  selectedText = toolBar.findBar.findPrevious();
  assert.waitFor(function () {
    var thirdSelection = selectedText.getRangeAt(0).startOffset;
    return firstSelection === thirdSelection;
  }, "First occurence of the text has been reselected");

  assert.equal(selectedText.toString().toLowerCase(), SEARCH_TEXT,
               "The correct text has been selected");

  toolBar.findBar.close();
}
