/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {expect} = require("../../../lib/assertions");
var utils = require("../../../lib/utils");

var browser = require("../ui/browser");

const BASE_URL = collector.addHttpResource("../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

const METHODS = ["shortcut", "shortcut2", "button"];

var setupModule = function(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.navBar = aModule.browserWindow.navBar;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;
}

var testLocationBarAPI = function() {
  // Test reload
  METHODS.forEach((aMethod) => {
    locationBar.reload({type: aMethod});
    controller.waitForPageLoad();

    locationBar.reload({type: aMethod, force: true});
    controller.waitForPageLoad();
  });

  // Test access to available elements
  var input = locationBar.getElement({type: "urlbar_input"});
  expect.equal(input.getNode().localName, "input");
  expect.contain(input.getNode().className, "urlbar-input");

  var contextMenu = locationBar.getElement({type: "contextMenu"});
  expect.equal(contextMenu.getNode().localName, "menupopup");

  var contextMenuEntry = locationBar.getElement({type: "contextMenu_entry",
                                                subtype: "paste"});
  expect.equal(contextMenuEntry.getNode().getAttribute("cmd"), "cmd_paste");

  var reloadButton = locationBar.getElement({type: "reloadButton"});
  expect.equal(reloadButton.getNode().command, "Browser:ReloadOrDuplicate");

  var urlbar = locationBar.getElement({type: "urlbar"});
  expect.equal(urlbar.getNode().localName, "textbox",
               "URL bar has been found");

  var favicon = locationBar.getElement({type: "favicon"});
  expect.equal(favicon.getNode().localName, "image", "Favicon has been found");

  var historyDropMarker = locationBar.getElement({type: "historyDropMarker"});
  expect.equal(historyDropMarker.getNode().localName, "dropmarker",
               "History drop marker has been found");

  var starButton = navBar.getElement({type: "starButton"});
  expect.equal(starButton.getNode().localName, "toolbarbutton",
               "Star button has been found");

  var stopButton = locationBar.getElement({type: "stopButton"});
  expect.equal(stopButton.getNode().localName, "toolbarbutton",
               "Stop button has been found");
}
