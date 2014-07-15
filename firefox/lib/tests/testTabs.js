/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {assert, expect} = require("../../../lib/assertions");
var tabs = require("../tabs");

const TEST_DATA = "string";

var setupModule = function (aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.tabBrowser(controller);
  aModule.findBar = aModule.tabBrowser.findBar;
}

var teardownModule = function (aModule) {
  aModule.findBar.value = "";
  aModule.findBar.close(true);
}

const NODES = [
  {type: "caseSensitiveButton", localName: "toolbarbutton"},
  {type: "closeButton", localName: "toolbarbutton"},
  {type: "highlightButton", localName: "toolbarbutton"},
  {type: "nextButton", localName: "toolbarbutton"},
  {type: "previousButton", localName: "toolbarbutton"},
  {type: "textbox", localName: "textbox"},
];

var testFindBarAPI = function () {
  // Test all opening methods
  findBar.open("menu");
  findBar.close();
  findBar.open("shortcut");

  // Test all available elements
  NODES.forEach(function (aElement) {
    var node = findBar.getElement({type: aElement.type}).getNode();
    expect.equal(node.localName, aElement.localName, "Element has been found");
  });

  // Check Case-Sensitive state
  assert.equal(findBar.caseSensitive, false);
  findBar.caseSensitive = true;
  assert.equal(findBar.caseSensitive, true);

  // Check Highlight state
  assert.equal(findBar.highlight, false);
  findBar.highlight = true;
  assert.equal(findBar.highlight, true);

  // Set text and clear it afterwards
  findBar.value = TEST_DATA;
  assert.equal(findBar.value, TEST_DATA,
               "Input has been correctly set inside the findBar");
  findBar.clear();
  assert.equal(findBar.value, "",
               "Input has been correctly cleared from inside the findBar");

  findBar.close();
}
