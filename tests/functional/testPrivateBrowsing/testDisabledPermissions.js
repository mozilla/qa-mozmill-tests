/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Anthony Hughes <ahughes@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

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
