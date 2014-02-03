/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");
var toolbar = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const TEST_DATA = [
  // Phishing URL object
  {
    buttonAccessKey : "safebrowsing.notAForgeryButton.accessKey",
    reportPage : "www.google.com/safebrowsing/report_error",
    unsafePage : "http://www.mozilla.org/firefox/its-a-trap.html"
  },
  // Malware URL object
  {
    buttonAccessKey : "safebrowsing.notAnAttackButton.accessKey",
    reportPage : "www.stopbadware.org",
    unsafePage : "http://www.mozilla.org/firefox/its-an-attack.html"
  }
];

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.locationBar = new toolbar.locationBar(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  aModule.tabBrowser.closeAllTabs();
}

function teardownModule(aModule) {
  // Clear the Safe Browsing permission
  utils.removePermission("www.mozilla.org", "safe-browsing");
}

var testNotificationBar = function() {
  TEST_DATA.forEach(function(aData) {
    // Load one of the safe browsing test pages
    controller.open(aData.unsafePage);
    controller.waitForPageLoad();

    // After waiting for the page click on the ignoreWarning button
    checkIgnoreWarningButton(aData);
    checkNoPhishingButton(aData);

    // Go back to the notification bar
    controller.open(aData.unsafePage);
    controller.waitForPageLoad();
    checkIgnoreWarningButton(aData);

    // Test the get me out of here button
    checkGetMeOutOfHereButton();

    // Go back to the notification bar
    controller.open(aData.unsafePage);
    controller.waitForPageLoad();
    checkIgnoreWarningButton(aData);

    // Test the x button on the drop down bar
    checkXButton();
  });
}

/**
 * Check the ignoreWarningButton goes to proper page associated to the URL provided
 *
 * @param {object} aData
 *        Object containing elements of testing page
 * @param {String} aData.buttonLabel
 *        Report button label
 * @param {String} aData.unsafePage
 *        URL of the harmful page
 * @param {String} aData.reportPage
 *        URL of the report page
 */
var checkIgnoreWarningButton = function(aData) {
  // Verify the element is loaded onto the page and go to the phishing site
  var ignoreWarningButton = new elementslib.ID(controller.tabs.activeTab, "ignoreWarningButton");
  var mainFeatureElem = new elementslib.ID(controller.tabs.activeTab, "main-feature");
  controller.waitThenClick(ignoreWarningButton);
  controller.waitForPageLoad();

  // Verify the warning button is not visible and the location bar displays the correct URL
  utils.assertLoadedUrlEqual(controller, aData.unsafePage);
  assert.ok(!ignoreWarningButton.exists(), "'Ignore warning' button has not been found");
  assert.ok(mainFeatureElem.exists(), "'Main feature' element has been found");

  // Clear the Safe Browsing permission
  utils.removePermission("www.mozilla.org", "safe-browsing");
}

/**
 * Check the not a forgery or attack button in the notification bar
 *
 * @param {object} aData
 *        Object containing elements of testing page
 * @param {String} aData.buttonLabel
 *        Report button label
 * @param {String} aData.unsafePage
 *        URL of the harmful page
 * @param {String} aData.reportPage
 *        URL of the report page
 */
var checkNoPhishingButton = function(aData) {
  // Click on the web forgery report button
 var buttonAccessKey = utils.getProperty("chrome://browser/locale/browser.properties",
                                         aData.buttonAccessKey);
 var button = tabBrowser.getTabPanelElement(tabBrowser.selectedIndex,
                                            '/{"value":"blocked-badware-page"}' +
                                            '/{"accesskey":"' + buttonAccessKey + '"}');

  tabBrowser.waitForTabPanel(tabBrowser.selectedIndex, '/{"value":"blocked-badware-page"}');
  controller.waitThenClick(button);
  controller.waitForPageLoad(controller.tabs.getTab(1));

  // Verify that the correct not a forgery or attack report page is loaded
  locationBar.contains(aData.reportPage);

  tabs.closeAllTabs(controller);
}

/**
 * Check the "Get me out of here" button in the notification bar
 */
var checkGetMeOutOfHereButton = function() {
  // Click on the get me out of here button
  var label = utils.getProperty("chrome://browser/locale/browser.properties",
                                "safebrowsing.getMeOutOfHereButton.label");
  var button = tabBrowser.getTabPanelElement(tabBrowser.selectedIndex,
                                             '/{"value":"blocked-badware-page"}/{"label":"' + label + '"}');

  tabBrowser.waitForTabPanel(tabBrowser.selectedIndex, '/{"value":"blocked-badware-page"}');
  controller.waitThenClick(button);

  // Verify that the default home page is displayed in the location bar
  controller.waitForPageLoad();

  var defaultHomepage = utils.getDefaultHomepage();
  utils.assertLoadedUrlEqual(controller, defaultHomepage);
}

/**
 * Check the X button in the notification bar
 */
var checkXButton = function() {
  // Click on the x button and verify the notification bar dissapears
  var button = tabBrowser.getTabPanelElement(tabBrowser.selectedIndex,
                                             '/{"value":"blocked-badware-page"}/anon({"type":"critical"})' +
                                             utils.australis.getElement("close-button"));

  tabBrowser.waitForTabPanel(tabBrowser.selectedIndex, '/{"value":"blocked-badware-page"}');
  controller.waitThenClick(button);

  controller.sleep(1000);
  assert.ok(!button.exists(), "The Close button has not been found");
}
