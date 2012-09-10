/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { expect } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'cookies/cookie_single.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();

  cm = Cc["@mozilla.org/cookiemanager;1"].
       getService(Ci.nsICookieManager2);
  cm.removeAll();
}

var teardownModule = function() {
  cm.removeAll();
  persisted.hostName = undefined;
}

/**
 * Tests enabling cookies from the preferences dialog
 */
var testEnableCookies = function() {
  // Call preferences dialog and disable cookies
  prefs.openPreferencesDialog(controller, prefEnableCookieDialogCallback);

  // Go to a test page to build a cookie
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  // Get the test page hostname
  persisted.hostName = controller.window.content.location.hostname;

  // Call preferences dialog and check cookies
  prefs.openPreferencesDialog(controller, prefCheckEnableDialogCallback);
}

/**
 * Go to the privacy pane and enables cookie saving
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefEnableCookieDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'panePrivacy';

  // Go to custom history settings and click on the show cookies button
  var historyMode = new elementslib.ID(controller.window.document, "historyMode");
  controller.waitForElement(historyMode);
  controller.select(historyMode, null, null, "custom");

  // Enable cookies
  var acceptCookiesPref = new elementslib.ID(controller.window.document, "acceptCookies");
  controller.check(acceptCookiesPref, true);

  // Close the preferences dialog
  prefDialog.close(true);
}

/**
 * Open the cookie manager from the privacy pane
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefCheckEnableDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);

  // Go to custom history settings and click on the show cookies button
  var historyMode = new elementslib.ID(controller.window.document, "historyMode");
  controller.waitForElement(historyMode);
  controller.select(historyMode, null, null, "custom");

  // The Show Cookies button doesn't receive focus that fast. Means a click will
  // fail if sent too early. There is no property we can check so far. So lets
  // use a sleep call for now.
  var showCookies = new elementslib.ID(controller.window.document, "showCookiesButton");
  controller.sleep(500);
  controller.click(showCookies);

  utils.handleWindow("type", "Browser:Cookies", checkSavedCookies);

  prefDialog.close(true);
}

/**
 * Check that cookies have been saved.
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function checkSavedCookies(controller) {
  controller.sleep(1000);

  // Verify that the single cookie is saved
  var removeCookieButton = new elementslib.ID(controller.window.document, "removeCookie");
  controller.waitForElement(removeCookieButton, TIMEOUT);
  controller.assertJSProperty(removeCookieButton, "disabled", false);

  var cookieExists = cm.cookieExists({host: persisted.hostName,
                                      name: "litmus_1",
                                      path: "/cookies/" });
  expect.ok(cookieExists, "The single cookie is saved.");

  var dtds = ["chrome://browser/locale/preferences/cookies.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  controller.keypress(null, cmdKey, {accelKey: true});
}

/**
 * Map test functions to litmus tests
 */
// testEnableCookies.meta = {litmusids : [8058]};
