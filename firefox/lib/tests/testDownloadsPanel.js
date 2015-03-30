/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var downloads = require("../../../lib/downloads");
var prefs = require("../../../lib/prefs");

var browser = require("../ui/browser");

const BASE_URL = collector.addHttpResource("../../../data/");
const TEST_DATA = {
  url: BASE_URL + "downloading/unknown_type.mtdl",
  elements: [
    {name: "openButton", type: "toolbarbutton"},
    {name: "panel", type: "panel"},
    {name: "showAllDownloads", type: "button"}
  ]
};

const DOWNLOADS_PANEL_ELEMENTS = {
  openButton: "toolbarbutton",
  panel: "panel",
  showAllDownloads: "button"
};

const PREF_PANEL_SHOWN = "browser.download.panel.shown";

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.downloadsPanel = aModule.browserWindow.navBar.downloadsPanel;

  // Bug 959103
  // Downloads gets duplicated with a new profile
  // Remove pref once this is fixed
  prefs.setPref(PREF_PANEL_SHOWN, true);
}

function teardownModule(aModule) {
  downloads.removeAllDownloads();
  aModule.downloadsPanel.close({force: true});
  prefs.clearUserPref(PREF_PANEL_SHOWN);
}

/**
 * Bug 1081024
 * Test that the elements in library are present on the Downloads Panel
 */
function testDownloadPanel() {
  var dialog = browserWindow.openUnknownContentTypeDialog(() => {
    browserWindow.controller.open(TEST_DATA.url);
  });

  dialog.save();

  downloadsPanel.open();
  expect.ok(downloadsPanel.isOpen, "Downloads panel is open");

  TEST_DATA.elements.forEach(aElement => {
    var element = downloadsPanel.getElement({type: aElement.name});
    expect.equal(element.getNode().localName, aElement.type,
                 aElement.name + " element has been found");
  });

  downloadsPanel.close();
}
