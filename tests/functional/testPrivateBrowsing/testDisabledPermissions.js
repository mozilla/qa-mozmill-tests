/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var modalDialog = require("../../../lib/modal-dialog");
var prefs = require("../../../lib/prefs");
var privateBrowsing = require("../../../lib/private-browsing");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGES = [
  LOCAL_TEST_FOLDER + 'popups/popup_trigger.html?count=2',
  LOCAL_TEST_FOLDER + 'cookies/cookie_single.html'
];

const PREF_COOKIE_BEHAVIOR = "network.cookie.cookieBehavior";
const PREF_COOKIE_LIFETIME_POLICY = "network.cookie.lifetimePolicy";

const TIMEOUT = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();

  // Create Private Browsing instance
  pb = new privateBrowsing.privateBrowsing(controller);

  // Enable the "Ask me every time" cookie behavior
  prefs.preferences.setPref(PREF_COOKIE_BEHAVIOR, 0);
  prefs.preferences.setPref(PREF_COOKIE_LIFETIME_POLICY, 1);
}

var teardownModule = function(module) {
  pb.reset();

  // Reset the user cookie pref
  prefs.preferences.clearUserPref(PREF_COOKIE_BEHAVIOR);
  prefs.preferences.clearUserPref(PREF_COOKIE_LIFETIME_POLICY);
}

/**
 * Verify various permissions are disabled when in Private Browsing mode
 */
var testPermissionsDisabled = function() {
  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  tabs.closeAllTabs(controller);

  pb.start();

  // Check that the "allow" button for pop-ups is disabled in the preferences
  controller.open(LOCAL_TEST_PAGES[0]);
  controller.waitForPageLoad();

  // Open context menu and check "Allow Popups" is disabled
  var property = mozmill.isWindows ? "popupWarningButton.accesskey" : "popupWarningButtonUnix.accesskey";
  var accessKey = utils.getProperty("chrome://browser/locale/browser.properties", property);

  controller.keypress(null, accessKey, {ctrlKey: mozmill.isMac, altKey: !mozmill.isMac});

  var allow = new elementslib.XPath(controller.window.document, 
                                    '/*[name()="window"]' +
                                    '/*[name()="popupset"][1]' +
                                    '/*[name()="menupopup"][4]' +
                                    '/*[name()="menuitem"][1]');

  controller.waitForElement(allow);
  controller.assertJSProperty(allow, "disabled", true);

  controller.keypress(null, "VK_ESCAPE", {});

  // No cookie dialog should show up
  controller.open(LOCAL_TEST_PAGES[1]);
  controller.waitForPageLoad();
}

/**
 * Just in case we open a modal dialog we have to mark the test as failed
 */
var cookieHandler = function(controller) {
  var button = new elementslib.ID(controller.window.document, "ok");
  controller.assertNodeNotExist(button);
}

/**
 * Map test functions to litmus tests
 */
// testPermissionsDisabled.meta = {litmusids : [9157]};
