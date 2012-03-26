/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();

  tabs.closeAllTabs(controller);
}

var teardownModule = function(module) {
  prefs.preferences.clearUserPref("browser.startup.homepage");
}

/**
 * Restore home page to default
 */
var testRestoreHomeToDefault = function() {
  // Open a web page for the temporary home page
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var link = new elementslib.Link(controller.tabs.activeTab, "Organization");
  controller.assertNode(link);

  // Call Preferences dialog and set home page
  prefs.openPreferencesDialog(controller, prefDialogHomePageCallback);

  // Go to the saved home page and verify it's the correct page
  controller.click(new elementslib.ID(controller.window.document, "home-button"));
  controller.waitForPageLoad();

  link = new elementslib.Link(controller.tabs.activeTab, "Organization");
  controller.assertNode(link);

  // Open Preferences dialog and reset home page to default
  prefs.openPreferencesDialog(controller, prefDialogDefHomePageCallback);

  // Check that the current homepage is set to the default homepage - about:home
  var currentHomepage = prefs.preferences.getPref("browser.startup.homepage", "");
  var defaultHomepage = utils.getDefaultHomepage();

  controller.assert(function () {
    return currentHomepage == defaultHomepage;
  }, "Default homepage restored - got " + currentHomepage + ", expected " +
    defaultHomepage);
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
  controller.waitForElement(useDefault, TIMEOUT);
  controller.click(useDefault);

  // Check that the homepage field has the default placeholder text
  var dtds = ["chrome://browser/locale/aboutHome.dtd"];
  var defaultHomepageTitle = utils.getEntity(dtds, "abouthome.pageTitle");
  var browserHomepageField = new elementslib.ID(controller.window.document, "browserHomePage");
  var browserHomepagePlaceholderText = browserHomepageField.getNode().placeholder;

  controller.assert(function () {
    return browserHomepagePlaceholderText == defaultHomepageTitle;
  }, "Default homepage title - got " + browserHomepagePlaceholderText + ", expected " +
    defaultHomepageTitle);

  prefDialog.close(true);
}

/**
 * Map test functions to litmus tests
 */
// testRestoreHomeToDefault.meta = {litmusids : [8327]};
