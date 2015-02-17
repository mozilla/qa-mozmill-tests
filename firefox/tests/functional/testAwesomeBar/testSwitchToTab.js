/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var {assert, expect} = require("../../../../lib/assertions");
var places = require("../../../../lib/places");
var tabs = require("../../../lib/tabs");

var browser = require("../../../lib/ui/browser");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = [
  {url: BASE_URL + "layout/mozilla_contribute.html", string: "contribute"},
  {url: BASE_URL + "layout/mozilla_governance.html", string: "governance"},
  {url: BASE_URL + "layout/mozilla_grants.html", string: "grants"}
];

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();
}

function teardownModule(aModule) {
  aModule.tabBrowser.closeAllTabs();
}

/**
 * Test Switch to Tab feature
 */
function testSwitchToTab() {
  TEST_DATA.forEach(function (aPage) {
    // History visit listener
    places.waitForVisited(aPage.url, () => {
      controller.open(aPage.url);
      controller.waitForPageLoad();
      tabBrowser.openTab();
    });
  });

  TEST_DATA.forEach(function (aPage) {
    locationBar.clear();
    locationBar.type(aPage.string);
    assert.waitFor(function () {
      return locationBar.value === aPage.string;
    }, "Location bar contains the typed data - expected '" + aPage.string + "'");

    assert.waitFor(function () {
      return locationBar.autoCompleteResults.isOpened;
    }, "Autocomplete popup has been opened");

    assert.waitFor(function () {
      return locationBar.autoCompleteResults.visibleResults.length > 0;
    }, "Waiting for autocomplete results to load");

    // Go through all results and click 'Switch to tab'
    var autoCompleteList = locationBar.autoCompleteResults.visibleResults;
    var switchToTab = autoCompleteList.some(function (aRichlistItem) {
      if (aRichlistItem.getNode().getAttribute("actiontype") === "switchtab") {
        // For the page title check matched text is underlined
        var underlined = locationBar.autoCompleteResults.
                         getUnderlinedText(aRichlistItem, "title");
        underlined.forEach(function (aElement, aIndex) {
          assert.waitFor(function () {
            aElement = locationBar.autoCompleteResults.
                       getUnderlinedText(aRichlistItem, "title")[aIndex];
            return aElement.toString().toLowerCase() === aPage.string;
          }, "The page title matches the underlined text");
        });

        controller.click(aRichlistItem);
        expect.waitFor(function () {
          return controller.tabs.activeTab.location.href === aPage.url;
        }, "Active tab url should equal the page url");

        return true;
      }

      return false;
    });

    expect.ok(switchToTab, "'Switch to tab' item is present");
  });
}

/**
 * Map test functions to moztrap tests
 */
testSwitchToTab.meta = {moztrap_case: 327};
