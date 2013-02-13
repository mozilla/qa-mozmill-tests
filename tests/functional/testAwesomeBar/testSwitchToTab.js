/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var {assert, expect} = require("../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var toolbars = require("../../../lib/toolbars");

const PLACES_DB_TIMEOUT = 4000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/layout/');
const LOCAL_TEST_PAGES = [
  {url: LOCAL_TEST_FOLDER + 'mozilla_contribute.html', string: "contribute"},
  {url: LOCAL_TEST_FOLDER + 'mozilla_governance.html', string: "governance"},
  {url: LOCAL_TEST_FOLDER + 'mozilla_grants.html', string: "grants"}
];

function setupModule() {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);
  tabBrowser = new tabs.tabBrowser(controller);

  tabBrowser.closeAllTabs();
}

function teardownModule() {
  tabBrowser.closeAllTabs();
}

/*
 * Test Switch to Tab feature
 */
function testSwitchToTab() {
  LOCAL_TEST_PAGES.forEach(function (aPage) {
    controller.open(aPage.url);
    controller.waitForPageLoad();
    tabBrowser.openTab();
  });

  // Wait for 4 seconds to work around Firefox LAZY ADD of items to the DB
  controller.sleep(PLACES_DB_TIMEOUT);

  LOCAL_TEST_PAGES.forEach(function (aPage) {
    locationBar.focus({type: "shortcut"});
    locationBar.type(aPage.string);
    assert.waitFor(function () {
      return locationBar.value === aPage.string;
    }, "Location bar contains the typed data - expected '" + aPage.string + "'");

    assert.waitFor(function () {
      return locationBar.autoCompleteResults.isOpened;
    }, "Autocomplete popup has been opened");

    assert.waitFor(function () {
      return locationBar.autoCompleteResults.length != 0;
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
