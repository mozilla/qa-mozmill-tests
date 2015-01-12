/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var { assert, expect } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");
var windows = require("../../../../lib/windows");

var prefWindow = require("../../../lib/ui/pref-window");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "cookies/cookie_single.html";

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  prefs.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
  Services.cookies.removeAll();
}

var teardownModule = function(aModule) {
  prefs.clearUserPref("network.cookie.cookieBehavior");
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);

  Services.cookies.removeAll();

  persisted.hostName = undefined;
}

/**
 * Tests disabling cookies from the preferences dialog
 */
var testDisableCookies = function() {
  // Call preferences dialog and disable cookies
  prefWindow.openPreferencesDialog(controller, prefDisableCookieDialogCallback);

  // Go to a test page to build a cookie
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the test page hostname
  persisted.hostName = controller.window.content.location.hostname;

  // Call preferences dialog and check cookies
  prefWindow.openPreferencesDialog(controller, prefCheckDisableDialogCallback);
}

/**
 * Go to the privacy pane and disable saving cookies
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var prefDisableCookieDialogCallback = function(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);
  prefDialog.paneId = 'panePrivacy';

  // Go to custom history settings and click on the show cookies button
  var historyMode = new elementslib.ID(aController.window.document, "historyMode");
  aController.waitForElement(historyMode);
  aController.select(historyMode, null, null, "custom");
  assert.waitFor(function () {
    return historyMode.getNode().value === "custom";
  }, "History mode is set to custom");

  var acceptCookiesPref = new elementslib.ID(aController.window.document, "acceptCookies");
  aController.check(acceptCookiesPref, false);

  // Close the preferences dialog
  prefDialog.close(true);
}

/**
 * Open the cookie manager from the privacy pane
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var prefCheckDisableDialogCallback = function(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);
  var showCookies = new elementslib.ID(aController.window.document, "showCookiesButton");
  aController.click(showCookies);

  windows.handleWindow("type", "Browser:Cookies", checkCookieNotSaved);

  prefDialog.close(true);
}

/**
 * Check that the cookie is not saved
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function checkCookieNotSaved(aController) {
  // Bug 513820
  // Remove Cookies button is not cleared when cookie list is cleared
  var removeCookieButton = new elementslib.ID(aController.window.document, "removeSelectedCookies");
  //expect.ok(removeCookieButton.getNode().disabled, "Remove Cookie Button is disabled");

  expect.equal(Services.cookies.countCookiesFromHost(persisted.hostName), 0,
               "Cookie is not saved");

  var dtds = ["chrome://browser/locale/preferences/cookies.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  aController.keypress(null, cmdKey, {accelKey: true});
}

