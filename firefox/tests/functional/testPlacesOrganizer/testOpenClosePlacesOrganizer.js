/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var utils = require("../../../../lib/utils");
var windows = require("../../../../lib/windows");

var browser = require("../../../lib/ui/browser");
var widgets = require("../../../../lib/ui/widgets");

const METHODS = [
  {
    actions: ["menu", "shortcut"],
    location: "downloads",
    titleProperty: "OrganizerQueryDownloads"
  },{
    actions: ["menu", "shortcut"],
    location: "bookmarks",
    titleProperty: "OrganizerQueryAllBookmarks"
  },{
    // There is no shortcut for history places window on OS X
    actions: mozmill.isMac ? ["menu"] : ["menu", "shortcut"],
    location: "history",
    titleProperty: "finduri-AgeInDays-is-0"
  }
];

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
}

function teardownModule(aModule) {
  windows.closeAllWindows(aModule.browserWindow);
}

/**
 * Bug 996530
 * Test open/close the places organizer
 */
function testOpenClosePlacesOrganizer() {
  METHODS.forEach((aItem, aIndex) => {
    aItem.actions.forEach(aType => {
      var placesOrganizerWindow = browserWindow.openPlacesOrganizer({location: aItem.location,
                                                                     type: aType});

      expect.equal(widgets.getSelectedCell(placesOrganizerWindow.tree).title,
                   placesOrganizerWindow.getProperty(aItem.titleProperty),
                   "Library has been opened and focused on the correct location");
      placesOrganizerWindow.close();
    })
  });
}
