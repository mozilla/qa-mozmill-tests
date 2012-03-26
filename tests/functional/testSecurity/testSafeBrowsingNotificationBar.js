/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();
}

function teardownModule(module) {
  // Clear the Safe Browsing permission
  utils.removePermission("www.mozilla.org", "safe-browsing");
}

var testNotificationBar = function() {
  var badSites = ['http://www.mozilla.org/firefox/its-a-trap.html',
                  'http://www.mozilla.org/firefox/its-an-attack.html'];

  for (var i = 0; i < badSites.length; i++ ) {
    // Go to one of mozilla's phishing protection test pages
    controller.open(badSites[i]);
    controller.waitForPageLoad();

    // Wait for the ignoreWarning button to be loaded onto the page and then click on the button
    checkIgnoreWarningButton(badSites[i]);
    checkNoPhishingButton(badSites[i]);

    // Go back to the notification bar
    controller.open(badSites[i]);
    controller.waitForPageLoad();
    checkIgnoreWarningButton(badSites[i]);

    // Test the get me out of here button
    checkGetMeOutOfHereButton();

    // Go back to the notification bar
    controller.open(badSites[i]);
    controller.waitForPageLoad();
    checkIgnoreWarningButton(badSites[i]);

    // Test the x button on the drop down bar
    checkXButton();
  }
}

/**
 * Check the ignoreWarningButton goes to proper page associated to the url provided
 *
 * @param badUrl {string} URL of testing page
 */
var checkIgnoreWarningButton = function(badUrl) {
  // Verify the element is loaded onto the page and go to the phishing site
  var ignoreWarningButton = new elementslib.ID(controller.tabs.activeTab, "ignoreWarningButton");
  controller.waitThenClick(ignoreWarningButton, gTimeout);
  controller.waitForPageLoad();

  // Verify the warning button is not visible and the location bar displays the correct url
  var locationBar = new elementslib.ID(controller.window.document, "urlbar");

  utils.assertLoadedUrlEqual(controller, badUrl);
  controller.assertNodeNotExist(ignoreWarningButton);
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "main-feature"));

  // Clear the Safe Browsing permission
  utils.removePermission("www.mozilla.org", "safe-browsing");
}

/**
 * Check the not a forgery or attack button in the notification bar
 *
 * @param badUrl {string} URL of testing page
 */
var checkNoPhishingButton = function(badUrl) {
  if (badUrl == 'http://www.mozilla.org/firefox/its-a-trap.html' ) {
    // Click on the web forgery report button
    var label = utils.getProperty("chrome://browser/locale/browser.properties",
                                  "safebrowsing.notAForgeryButton.label");
    var button = tabBrowser.getTabPanelElement(tabBrowser.selectedIndex,
                                               '/{"value":"blocked-badware-page"}/{"label":"' + label + '"}');
    
    tabBrowser.waitForTabPanel(tabBrowser.selectedIndex, '/{"value":"blocked-badware-page"}');
    controller.waitThenClick(button, gTimeout);
    controller.waitForPageLoad(controller.tabs.getTab(1));

    // Verify the not-a-web-forgery report page is loaded
    var urlField = new elementslib.ID(controller.tabs.activeTab, "url");
    controller.waitForElement(urlField, gTimeout);
    controller.assertValue(urlField, 'http://www.mozilla.org/firefox/its-a-trap.html');

  } else if (badUrl == 'http://www.mozilla.org/firefox/its-an-attack.html' ) {
    // Click on the attack site report button
    var label = utils.getProperty("chrome://browser/locale/browser.properties",
                                  "safebrowsing.notAnAttackButton.label");
    var button = tabBrowser.getTabPanelElement(tabBrowser.selectedIndex,
                                               '/{"value":"blocked-badware-page"}/{"label":"' + label + '"}');
    
    tabBrowser.waitForTabPanel(tabBrowser.selectedIndex, '/{"value":"blocked-badware-page"}');
    controller.waitThenClick(button, gTimeout);
    controller.waitForPageLoad(controller.tabs.getTab(1));

    // Verify the not-an-attack-site report page is loaded
    var locationBar = new elementslib.ID(controller.window.document, "urlbar");
    var currentURL = locationBar.getNode().value;
    controller.assert(function () {
      return currentURL.indexOf('www.stopbadware.org/') != -1;
    }, "Loaded URL is the report page - got " + currentURL + ", expected " +
       "'www.stopbadware.org/'");
  }

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
  controller.waitThenClick(button, gTimeout);

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
                                             '/{"class":"messageCloseButton tabbable"}');
  
  tabBrowser.waitForTabPanel(tabBrowser.selectedIndex, '/{"value":"blocked-badware-page"}');
  controller.waitThenClick(button, gTimeout);
  
  controller.sleep(1000);
  controller.assertNodeNotExist(button);
}
