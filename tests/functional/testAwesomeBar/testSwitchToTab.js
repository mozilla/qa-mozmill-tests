/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var {expect} = require("../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var toolbars = require("../../../lib/toolbars");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/layout/');
const LOCAL_TEST_PAGES = [
  {url: LOCAL_TEST_FOLDER + 'mozilla_community.html', string: "community"},
  {url: LOCAL_TEST_FOLDER + 'mozilla_contribute.html', string: "contribute"},
  {url: LOCAL_TEST_FOLDER + 'mozilla_governance.html', string: "governance"}
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

  LOCAL_TEST_PAGES.forEach(function (aPage) {
    locationBar.focus({type: "shortcut"});
    locationBar.type(aPage.string);
    controller.waitFor(function () {
      return locationBar.value === aPage.string;
    }, "Location bar contains the typed data - expected '" + aPage.string + "'");

    controller.waitFor(function () {
      return locationBar.autoCompleteResults.isOpened;
    }, "Autocomplete popup has been opened");

    controller.waitFor(function () {
      return locationBar.autoCompleteResults.length != 0;
    }, "Waiting for autocomplete results to load");

    // Go through all results and click 'Switch to tab'
    var autoCompleteList = locationBar.autoCompleteResults.visibleResults;
    var switchToTab = false;
    autoCompleteList.some(function (aRichlistItem) {
      var item = locationBar.autoCompleteResults.getUnderlinedText(aRichlistItem,
                                                                   "title");
      if (aRichlistItem.getNode().getAttribute("actiontype") === "switchtab") {
        switchToTab = true;
        expect.equal(aPage.string, item.toString().toLowerCase(),
                     "The page title matches the underlined text");
        controller.click(aRichlistItem);
        expect.equal(controller.tabs.activeTab.location.href, aPage.url,
                     "Active tab url should equal the page url");
      }

      return switchToTab;
    });

    expect.ok(switchToTab, "Expected 'Switch to tab' item to be present");
  });
}

/**
 * Map test functions to moztrap tests
 */
testSwitchToTab.meta = {moztrap_case: 327};

