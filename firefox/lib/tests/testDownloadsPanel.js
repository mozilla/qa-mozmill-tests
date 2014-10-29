/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var toolbars = require("../toolbars");

var browser = require("../ui/browser");

const DOWNLOADS_PANEL_ELEMENTS = {
  openButton: "toolbarbutton",
  panel: "panel",
  showAllDownloads: "button"
};

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.downloadsPanel = new toolbars.DownloadsPanel(aModule.browserWindow);
}

function teardownModule(aModule) {
  aModule.downloadsPanel.close({force: true});
}

/**
 * Bug 1081024
 * Test that the elements in library are present on the Downloads Panel
 */
function testDownloadPanel() {
  downloadsPanel.open();
  expect.ok(downloadsPanel.isOpen, "Downloads panel is open");

  for (var element in DOWNLOADS_PANEL_ELEMENTS) {
    var el = downloadsPanel.getElement({type: element});
    expect.equal(el.getNode().localName, DOWNLOADS_PANEL_ELEMENTS[element],
                 "element has been found - " + element);
  }

  downloadsPanel.close();
}
