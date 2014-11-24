/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var places = require("../../../../lib/places");
var utils = require("../../../../lib/utils");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "awesomebar/copypaste.html";

var setupModule = function(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  // Clear complete history so we don't get interference from previous entries
  places.removeAllHistory();

  // Clear the clipboard so we don't get data from previous tests in clipboard
  utils.emptyClipboard();
}

var teardownModule = function(aModule) {
  aModule.locationBar.closeContextMenu();
}

/**
 * Grab some text from a web page and then paste it into the toolbar
 *
 */
var testPasteLocationBar = function() {
  // Open the test page
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Focus on page, select text and copy to clipboard
  var ipsumLocation = new elementslib.ID(controller.window.document, 'ipsum');
  controller.doubleClick(ipsumLocation);
  var docSelection = controller.tabs.activeTabWindow.getSelection().toString();

  // Copy "ipsum" into clipboard
  var dtds = ["chrome://browser/locale/browser.dtd"];
  var cmdKey = utils.getEntity(dtds, "copyCmd.key");
  controller.keypress(null, cmdKey, {accelKey: true});

  // Clear the locationBar
  locationBar.clear();

  // Get the urlbar input box, right click in it, and select paste from context menu
  var input = locationBar.getElement({type: "urlbar_input"});
  controller.rightClick(input);
  var contextMenuEntry = locationBar.getElement({type: "contextMenu_entry", subtype: "paste"});
  controller.click(contextMenuEntry);

  // Get contents of the location bar and compare it to the expected result
  assert.waitFor(function () {
    return locationBar.value === docSelection;
  }, "Location bar should contain pasted clipboard content - expected " + docSelection);
}
