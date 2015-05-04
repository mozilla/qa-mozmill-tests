/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var browser = require("../ui/browser");
var windows = require("../../../lib/windows");

const TEST_DATA = {
  url: "ftp://ftp.mozilla.org/pub/firefox/releases/3.6/mac/en-US/Firefox%203.6.dmg",
  elements: {
    cancel: "button",
    accept: "button",
    remember: "checkbox",
    save: "radio"
  }
};

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
}

function teardownModule(aModule) {
  windows.closeAllWindows(aModule.browserWindow);
}

/**
 * Bug 1081047
 * Add new ui module for the unknownContentType dialog
 */
function testUnknownContentTypeDialog() {
  var dialog = browserWindow.openUnknownContentTypeDialog(() => {
    browserWindow.controller.open(TEST_DATA.url);
  });

  for (var element in TEST_DATA.elements) {
    if (TEST_DATA.elements[element] === "button") {
      var el = dialog.getElement({type: TEST_DATA.elements[element],
                                  subtype: element});
    }
    else {
      var el = dialog.getElement({type: element});
    }
    expect.equal(el.getNode().localName, TEST_DATA.elements[element],
                 "Element has been found - " + element);
  }

  dialog.close();
}
