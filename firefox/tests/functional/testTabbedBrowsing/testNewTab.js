/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var {expect} = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

const PREF_NEWTAB_URL = "browser.newtab.url";

// Bug 874344
// We need to handle Australis builds as exceptions and we should
// remove unaplicable code after Australis lands as Nightly
const IS_AUSTRALIS_BUILD = utils.australis.isAustralis();

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
  aModule.tabBrowser.closeAllTabs();

  if (!IS_AUSTRALIS_BUILD) {
    // Save old state
    aModule.oldTabsOnTop = aModule.tabBrowser.hasTabsOnTop;
  }
}

function teardownModule(aModule) {
  if (!IS_AUSTRALIS_BUILD)
    aModule.tabBrowser.hasTabsOnTop = aModule.oldTabsOnTop;
}

function testNewTab() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Ensure current tab does not have blank page loaded
  var section = new elementslib.ID(controller.tabs.activeTab, "organization");
  controller.waitForElement(section);

  if (!IS_AUSTRALIS_BUILD) {
    // First, perform all tests with tabs on bottom
    tabBrowser.hasTabsOnTop = false;
    checkOpenTab("menu");
    checkOpenTab("shortcut");
    checkOpenTab("newTabButton");
    checkOpenTab("tabStrip");

    // Second, perform all tests with tabs on top
    tabBrowser.hasTabsOnTop = true;

    // NOTE: On Linux and beginning with Windows Vista a double click onto the
    //       tabstrip maximizes the window instead. So don't execute this test
    //       on those os versions.
    var version = Services.sysinfo.getProperty("version");

    if (mozmill.isMac || (mozmill.isWindows && (version < "6.0"))) {
     checkOpenTab("tabStrip");
    }
  }

  checkOpenTab("menu");
  checkOpenTab("shortcut");
  checkOpenTab("newTabButton");
}

/**
 * Check if a new tab has been opened, has a title and can be closed
 *
 * @param {String} aEventType Type of event which triggers the action
 */
function checkOpenTab(aEventType) {
  // Open a new tab and check that 'about:newtab' has been opened
  tabBrowser.openTab({method: aEventType});

  // Bug 716108 has landed but we still require this for a clean test
  controller.waitForPageLoad();

  var newTabURL = prefs.getPref(PREF_NEWTAB_URL, '');

  expect.equal(tabBrowser.length, 2, "Two tabs visible - opened via " + aEventType);
  expect.equal(controller.tabs.activeTab.location.href, newTabURL,
               "Opened new tab");

  // The tabs title should be 'New Tab'
  var title = utils.getEntity(tabBrowser.getDtds(), "newtab.pageTitle");

  expect.equal(tabBrowser.getTab().getNode().label, title, "Correct tab title");

  // Close the tab again
  tabBrowser.closeTab();
}
