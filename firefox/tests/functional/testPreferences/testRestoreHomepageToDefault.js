/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var {assert, expect} = require("../../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  tabs.closeAllTabs(aModule.controller);
}

var teardownModule = function(aModule) {
  prefs.preferences.clearUserPref("browser.startup.homepage");
}

/**
 * Restore home page to default
 */
var testRestoreHomeToDefault = function() {
  // Open a web page for the temporary home page
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var link = new elementslib.Link(controller.tabs.activeTab, "Organization");
  assert.ok(link.exists(), "'Organization' link has been found");

  // Call Preferences dialog and set home page
  prefs.openPreferencesDialog(controller, prefDialogHomePageCallback);

  // Go to the saved home page and verify it's the correct page
  controller.click(new elementslib.ID(controller.window.document, "home-button"));
  controller.waitForPageLoad();

  link = new elementslib.Link(controller.tabs.activeTab, "Organization");
  assert.ok(link.exists(), "'Organization' link has been found");

  // Open Preferences dialog and reset home page to default
  prefs.openPreferencesDialog(controller, prefDialogDefHomePageCallback);

  // Check that the current homepage is set to the default homepage - about:home
  var currentHomepage = prefs.preferences.getPref("browser.startup.homepage", "");
  var defaultHomepage = utils.getDefaultHomepage();

  assert.equal(currentHomepage, defaultHomepage, "Default homepage restored");
}

/**
 * Set the current page as home page via the preferences dialog
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogHomePageCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneMain';

  // Set home page to the current page
  var useCurrent = new elementslib.ID(controller.window.document, "useCurrent");
  controller.waitThenClick(useCurrent);
  controller.sleep(100);

  prefDialog.close(true);
}

var prefDialogDefHomePageCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);

  // Reset home page to the default page
  var useDefault = new elementslib.ID(controller.window.document, "restoreDefaultHomePage");
  controller.waitForElement(useDefault);
  controller.click(useDefault);

  // Check that the homepage field has the default placeholder text
  var dtds = ["chrome://browser/locale/aboutHome.dtd"];
  var defaultHomepageTitle = utils.getEntity(dtds, "abouthome.pageTitle");
  var browserHomepageField = new elementslib.ID(controller.window.document, "browserHomePage");
  var browserHomepagePlaceholderText = browserHomepageField.getNode().placeholder;

  expect.equal(browserHomepagePlaceholderText, defaultHomepageTitle, "Default homepage title");

  prefDialog.close(true);
}

