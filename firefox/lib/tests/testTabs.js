/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var tabs = require("../tabs");

var browser = require("../ui/browser");

const TEST_DATA = {
  text: "string",
  fragment: "#sync",
  url1: "about:preferences",
  url2: "about:accounts"
};

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = browserWindow.controller;
  aModule.tabBrowser = new tabs.tabBrowser(controller);
  aModule.findBar = aModule.tabBrowser.findBar;
}

function teardownModule(aModule) {
  aModule.findBar.value = "";
  aModule.findBar.close(true);
  aModule.tabBrowser.closeAllTabs();
}

const NODES = [
  {type: "caseSensitiveButton", localName: "toolbarbutton"},
  {type: "closeButton", localName: "toolbarbutton"},
  {type: "highlightButton", localName: "toolbarbutton"},
  {type: "nextButton", localName: "toolbarbutton"},
  {type: "previousButton", localName: "toolbarbutton"},
  {type: "textbox", localName: "textbox"},
];

/**
 * Test tabBrowser closeAllTabs() method
 * Bug 1122516
 */
function testCloseAllTabs() {
  for (var i = 0; i < 3; i++) {
    browserWindow.tabs.openTab();
    browserWindow.controller.open("about:blank?index=" + i);
  }

  browserWindow.tabs.closeAllTabs();

  expect.equal(browserWindow.tabs.length, 1,
               "There is only one open tab");

  var location = browserWindow.controller.tabs.activeTab.location.toString();
  expect.equal(location, "about:newtab",
               "'about:newtab' tab is open and is the active tab");
}

var testFindBarAPI = function () {
  // Test all opening methods
  findBar.open("menu");
  findBar.close();
  findBar.open("shortcut");

  // Test all available elements
  NODES.forEach(function (aElement) {
    var node = findBar.getElement({type: aElement.type}).getNode();
    expect.equal(node.localName, aElement.localName, "Element has been found");
  });

  // Check Case-Sensitive state
  assert.equal(findBar.caseSensitive, false);
  findBar.caseSensitive = true;
  assert.equal(findBar.caseSensitive, true);

  // Check Highlight state
  assert.equal(findBar.highlight, false);
  findBar.highlight = true;
  assert.equal(findBar.highlight, true);

  // Set text and clear it afterwards
  findBar.value = TEST_DATA.text;
  assert.equal(findBar.value, TEST_DATA.text,
               "Input has been correctly set inside the findBar");
  findBar.clear();
  assert.equal(findBar.value, "",
               "Input has been correctly cleared from inside the findBar");

  findBar.close();
}

/**
 * Test finding tabs by url
 * Bug 1081014
 */
function testTabs() {
  openTabWithUrl(TEST_DATA.url1 + TEST_DATA.fragment);
  openTabWithUrl(TEST_DATA.url1);
  openTabWithUrl(TEST_DATA.url2);

  var tabsWithUrl = tabs.getTabsWithURL(TEST_DATA.url1, true);
  expect.equal(tabsWithUrl.length, 2, "Expected tabs have been found");

  tabsWithUrl = tabs.getTabsWithURL(TEST_DATA.url1 + TEST_DATA.fragment, true);
  expect.equal(tabsWithUrl.length, 2, "Expected tabs have been found");

  tabsWithUrl = tabs.getTabsWithURL(TEST_DATA.url1);
  expect.equal(tabsWithUrl.length, 1, "Expected tabs have been found");

  tabsWithUrl = tabs.getTabsWithURL(TEST_DATA.url2);
  expect.equal(tabsWithUrl.length, 1, "Expected tabs have been found");
}

/*
 * Test select tab
 * Bug 1071566
 */
function testTabSelect(){
  // Select first tab using selectTab -click method
  tabBrowser.selectTab({index: 0});

  // Check if the first tab is selected
  assert.waitFor(() => (tabBrowser.selectedIndex === 0),
                 "First tab has been selected");

  // Select third tab using selectTab - callback method
  tabBrowser.selectTab({
    method: "callback",
    callback: () => {
      tabBrowser.getTab(2).click();
    }
  });

  // Check if the third tab is selected
  assert.waitFor(() => (tabBrowser.selectedIndex === 2),
                 "Third tab has been selected");

  // Select last tab using selectTab via reference
  lastTab = tabBrowser.getTab(tabBrowser.length - 1);
  tabBrowser.selectTab({tab: lastTab });

  // Check if the last tab is selected
  assert.waitFor(() => (tabBrowser.selectedIndex === tabBrowser.length - 1),
                 "Last tab has been selected");
}

/**
 * Open a new tab and navigate to a specific page
 *
 * @param {string} aUrl
 *        Url of the page to navigate to
 */
function openTabWithUrl(aUrl) {
  tabBrowser.openTab();
  controller.open(aUrl);
  controller.waitForPageLoad();
}
