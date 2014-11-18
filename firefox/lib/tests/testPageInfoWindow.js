/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var browser = require("../ui/browser");
var windows = require("../../../lib/windows");

const BASE_URL = collector.addHttpResource("../../../data/");
const TEST_DATA = {
  url: BASE_URL + "layout/mozilla.html",
  categories: [
    {
      name: "general",
      value: "radio",
      elements: [{type: "panel", subtype: "general", localName: "vbox"}]
    },
    {
      name: "media",
      value: "radio",
      elements: [{type: "panel", subtype: "media", localName: "vbox"}]
    },
    {
      name: "perm",
      value: "radio",
      elements: [{type: "panel", subtype: "perm", localName: "vbox"}]
    },
    {
      name: "security",
      value: "radio",
      elements: [
        {type: "panel", subtype: "security", localName: "vbox"},
        {type: "security", subtype: "domain", localName: "textbox"},
        {type: "security", subtype: "owner", localName: "textbox"},
        {type: "security", subtype: "verifier", localName: "textbox"},
        {type: "security", subtype: "cert", localName: "button"},
        {type: "security", subtype: "cookies", localName: "button"},
        {type: "security", subtype: "password", localName: "button"}
      ]
    }
  ]
};

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
}

function teardownModule(aModule) {
  windows.closeAllWindows(aModule.browserWindow);
}

function testPageInfoWindow() {
  browserWindow.controller.open(TEST_DATA.url);
  browserWindow.controller.waitForPageLoad();

  var contentElement = findElement.ID(browserWindow.controller.tabs.activeTab,
                                      "content");
  var win1 = browserWindow.openPageInfoWindow({method: "contextMenu",
                                               target: contentElement});
  win1.close();

  var win2 = browserWindow.openPageInfoWindow({method: "shortcut"});
  win2.close();

  var win3 = browserWindow.openPageInfoWindow({method: "menu"});
  win3.close();

  var win4 = browserWindow.openPageInfoWindow();

  TEST_DATA.categories.forEach(aCategory => {
    win4.category = aCategory.name;

    aCategory.elements.forEach(element => {
      let el = win4.getElement({type: element.type, subtype: element.subtype});
      expect.equal(el.getNode().localName, element.localName,
                   "Element has been found - " + element.localName);
    });
  });
  win4.close();
}
