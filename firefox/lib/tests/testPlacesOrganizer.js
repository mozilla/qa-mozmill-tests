/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var utils = require("../../../lib/utils");
var windows = require("../../../lib/windows");

var browser = require("../ui/browser");
var placesOrganizer = require("../ui/places-organizer");
var widgets = require("../../../lib/ui/widgets");

const ELEMENTS = [
  {type: "backButton", localName: "toolbarbutton"},
  {type: "forwardButton", localName: "toolbarbutton"},
  // Handle differences in elements local names between OSX and rest of the platforms
  {type: "organizeButton", localName: mozmill.isMac ? "toolbarbutton" : "menu"},
  {type: "viewMenu", localName: mozmill.isMac ? "toolbarbutton" : "menu"},
  {type: "maintenanceButton", localName: mozmill.isMac ? "toolbarbutton" : "menu"},
  {type: "searchFilter", localName: "textbox"},
  {type: "tree", localName: "tree"}
];

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
}

function teardownModule(aModule) {
  windows.closeAllWindows(aModule.browserWindow);
}

function testPlacesOrganizerWindow() {
  var win = browserWindow.openPlacesOrganizer();
  var bookmarksTitle = win.getProperty("OrganizerQueryAllBookmarks");
  expect.equal(widgets.getSelectedCell(win.tree).title, bookmarksTitle,
               "Library has been opened on the correct location");

  // Test all available elements
  ELEMENTS.forEach(aElement => {
    var element = win.getElement({type: aElement.type});
    expect.equal(element.getNode().localName, aElement.localName,
                 "Element '" + aElement.type + "' has been found");
  });
}
