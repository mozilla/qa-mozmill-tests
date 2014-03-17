/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { expect } = require("../../../lib/assertions");
var toolbars = require("../ui/toolbars");

const BASE_URL = collector.addHttpResource("../../../data/");
const TEST_DATA = [
  BASE_URL + "layout/mozilla_projects.html",
  BASE_URL + "layout/mozilla_mission.html"
];

const ELEMENTS = {
  downloads: [
    {name: "progressBar", type: "circularprogressindicator"}
  ],
  findBar: [
    {name: "findbar", type:"appbar"},
    {name: "nextButton", type: "toolbarbutton"},
    {name: "previousButton", type: "toolbarbutton"}
  ],
  locationBar: [
    {name: "backButton", type: "toolbarbutton"},
    {name: "forwardButton", type: "toolbarbutton"},
    {name: "reloadButton", type: "toolbarbutton"},
    {name: "stopButton", type: "toolbarbutton"}
  ],
  toolBar: [
    {name: "findInPage", type: "richlistitem"},
    {name: "menuButton", type: "toolbarbutton"},
    {name: "pinButton", type: "toolbarbutton"},
    {name: "starButton", type: "toolbarbutton"}
  ]
};

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.toolbar = new toolbars.ToolBar(aModule.controller);
}

function testDownloads() {
  controller.open("about:support");
  controller.waitForPageLoad();

  ELEMENTS.downloads.forEach(function (aElement) {
    var element = toolbar.downloads.getElement({type: aElement.name});
    expect.equal(element.getNode().localName, aElement.type, aElement.name + " exists");
  });
}

function testFindBar() {
  controller.open(TEST_DATA[0]);
  controller.waitForPageLoad();

  // Open findbar via menu button and check it's elements
  toolbar.findBar.open("menu");
  expect.ok(toolbar.findBar.isOpen, "Findbar has been opened via menu");

  ELEMENTS.findBar.forEach(function (aElement) {
    var element = toolbar.findBar.getElement({type: aElement.name});
    expect.equal(element.getNode().localName, aElement.type, aElement.name + " exists");
  });

  var textbox = toolbar.findBar.getElement({type: "textbox"});
  toolbar.findBar.type("project");
  expect.equal(textbox.getNode().value, "project", "Expected text is present");

  // Close findbar via the close button
  toolbar.findBar.close();
  expect.ok(!toolbar.findBar.isOpen, "Findbar has been closed via the close button");

  // Open and close findbar via shortcut
  toolbar.findBar.open("shortcut");
  expect.ok(toolbar.findBar.isOpen, "Findbar has been opened via shortcut");

  toolbar.findBar.close("shortcut");
  expect.ok(!toolbar.findBar.isOpen, "Findbar has been closed via shortcut");
}

function testToolbarCheck() {
  toolbar.open();
  expect.ok(toolbar.isVisible(), "Toolbar has been opened");

  toolbar.locationBar.focus();
  toolbar.locationBar.type("url");
  expect.equal(toolbar.locationBar.value, "url", "Correct text has been typed in location bar");

  var closeSuggestionsButton = toolbar.getElement({type: "closeSuggestionsButton"});
  closeSuggestionsButton.tap();

  var suggestionsPanel = toolbar.getElement({type: "suggestionsPanel"});
  expect.ok(suggestionsPanel.getNode().hidden, "Suggestions panel has been closed");

  toolbar.locationBar.clear();
  expect.equal(toolbar.locationBar.value, "", "Location bar is empty");

  TEST_DATA.forEach(function (aPage) {
    controller.open(aPage);
    controller.waitForPageLoad();
  });

  // Check the buttons of the toolBar and the locationBar
  ELEMENTS.toolBar.forEach(function (aElement) {
    var element = toolbar.getElement({type: aElement.name});
    expect.equal(element.getNode().localName, aElement.type, aElement.name + " exists");
  });

  ELEMENTS.locationBar.forEach(function (aElement) {
    var element = toolbar.locationBar.getElement({type: aElement.name});
    expect.equal(element.getNode().localName, aElement.type, aElement.name + " exists");
  });
}
