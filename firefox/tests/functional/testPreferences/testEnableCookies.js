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
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);

  Services.cookies.removeAll();
  persisted.hostName = undefined;
}

/**
 * Tests enabling cookies from the preferences dialog
 */
var testEnableCookies = function() {
  // Call preferences dialog and disable cookies
  prefWindow.openPreferencesDialog(controller, prefEnableCookieDialogCallback);

  // Go to a test page to build a cookie
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the test page hostname
  persisted.hostName = controller.window.content.location.hostname;

  // Call preferences dialog and check cookies
  prefWindow.openPreferencesDialog(controller, prefCheckEnableDialogCallback);
}

/**
 * Go to the privacy pane and enables cookie saving
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var prefEnableCookieDialogCallback = function(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);
  prefDialog.paneId = 'panePrivacy';

  // Go to custom history settings and click on the show cookies button
  var historyMode = new elementslib.ID(aController.window.document, "historyMode");
  aController.waitForElement(historyMode);
  aController.select(historyMode, null, null, "custom");
  assert.waitFor(function () {
    return historyMode.getNode().value === "custom";
  }, "History mode is set to custom");

  // Enable cookies
  var acceptCookiesPref = new elementslib.ID(aController.window.document, "acceptCookies");
  aController.check(acceptCookiesPref, true);

  // Close the preferences dialog
  prefDialog.close(true);
}

/**
 * Open the cookie manager from the privacy pane
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var prefCheckEnableDialogCallback = function(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  // Go to custom history settings and click on the show cookies button
  var historyMode = new elementslib.ID(aController.window.document, "historyMode");
  aController.waitForElement(historyMode);
  aController.select(historyMode, null, null, "custom");
  assert.waitFor(function () {
    return historyMode.getNode().value === "custom";
  }, "History mode is set to custom");

  var showCookies = new elementslib.ID(aController.window.document, "showCookiesButton");
  aController.click(showCookies);

  windows.handleWindow("type", "Browser:Cookies", checkSavedCookies);

  prefDialog.close(true);
}

/**
 * Check that cookies have been saved.
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function checkSavedCookies(aController) {
  var removeCookieButton = new elementslib.ID(aController.window.document, "removeSelectedCookies");
  aController.waitForElement(removeCookieButton);
  expect.ok(!removeCookieButton.getNode().disabled, "The Remove Cookie Button is disabled");

  var cookieExists = Services.cookies.cookieExists({host: persisted.hostName,
                                                    name: "litmus_1",
                                                    path: "/cookies/" });
  expect.ok(cookieExists, "The single cookie is saved.");

  var dtds = ["chrome://browser/locale/preferences/cookies.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  aController.keypress(null, cmdKey, {accelKey: true});
}

