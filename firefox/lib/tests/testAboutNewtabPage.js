/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var aboutNewTab = require("../ui/about-newtab-page");
var browser = require("../ui/browser");

const TEST_DATA = [
  {name: "grid", localName: "div"},
  {name: "introPanel", localName: "panel"},
  {name: "whatIsThisPage", localName: "div"},
  {name: "introPanel_LearnMore", localName: "a"},
  {name: "introPanel_PrivacyNotice", localName: "a"}
];

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.aboutNewTab = new aboutNewTab.AboutNewtabPage(aModule.browserWindow);
}

function teardownModule(aModule) {
  aModule.browserWindow.tabs.closeAllTabs();
}

/**
 * Verify the 'about:newtab' page content elements
 */
function testAboutNewTab() {
  aboutNewTab.open();
  assert.ok(aboutNewTab.isOpen, "Tab with the in-content page has been opened");

  TEST_DATA.forEach((aElement, aIndex) => {
    var el = aboutNewTab.getElement({type: aElement.name});
    if (aIndex === 3) {
      aboutNewTab.openWhatIsThisPage();
    }
    assert.waitFor(() => (el.getNode().localName === aElement.localName),
                   "Element has been found '" + aElement.name);
  });
}
