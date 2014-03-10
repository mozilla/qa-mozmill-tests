/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var { assert, expect } = require("../../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "cookies/cookie_single.html";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  Services.cookies.removeAll();
}

var teardownModule = function(aModule) {
  prefs.preferences.clearUserPref("network.cookie.cookieBehavior");
  Services.cookies.removeAll();

  persisted.hostName = undefined;
}

/**
 * Tests disabling cookies from the preferences dialog
 */
var testDisableCookies = function() {
  // Call preferences dialog and disable cookies
  prefs.openPreferencesDialog(controller, prefDisableCookieDialogCallback);

  // Go to a test page to build a cookie
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the test page hostname
  persisted.hostName = controller.window.content.location.hostname;

  // Call preferences dialog and check cookies
  prefs.openPreferencesDialog(controller, prefCheckDisableDialogCallback);
}

/**
 * Go to the privacy pane and disable saving cookies
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDisableCookieDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'panePrivacy';

  // Go to custom history settings and click on the show cookies button
  var historyMode = new elementslib.ID(controller.window.document, "historyMode");
  controller.waitForElement(historyMode);
  controller.select(historyMode, null, null, "custom");
  assert.waitFor(function () {
    return historyMode.getNode().value === "custom";
  }, "History mode is set to custom");

  var acceptCookiesPref = new elementslib.ID(controller.window.document, "acceptCookies");
  controller.check(acceptCookiesPref, false);

  // Close the preferences dialog
  prefDialog.close(true);
}

/**
 * Open the cookie manager from the privacy pane
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefCheckDisableDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  var showCookies = new elementslib.ID(controller.window.document, "showCookiesButton");
  controller.click(showCookies);

  utils.handleWindow("type", "Browser:Cookies", checkCookieNotSaved);

  prefDialog.close(true);
}

/**
 * Check that the cookie is not saved
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function checkCookieNotSaved(controller) {
  // Bug 513820
  // Remove Cookies button is not cleared when cookie list is cleared
  var removeCookieButton = new elementslib.ID(controller.window.document, "removeCookie");
  //expect.ok(removeCookieButton.getNode().disabled, "Remove Cookie Button is disabled");

  expect.equal(Services.cookies.countCookiesFromHost(persisted.hostName), 0,
               "Cookie is not saved");

  var dtds = ["chrome://browser/locale/preferences/cookies.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  controller.keypress(null, cmdKey, {accelKey: true});
}

