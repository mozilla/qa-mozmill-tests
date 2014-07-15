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
  Services.cookies.removeAll();
  persisted.hostName = undefined;
}

/**
 * Tests enabling cookies from the preferences dialog
 */
var testEnableCookies = function() {
  // Call preferences dialog and disable cookies
  prefs.openPreferencesDialog(controller, prefEnableCookieDialogCallback);

  // Go to a test page to build a cookie
  controller.open(TEST_DATA);
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
  assert.waitFor(function () {
    return historyMode.getNode().value === "custom";
  }, "History mode is set to custom");

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
  assert.waitFor(function () {
    return historyMode.getNode().value === "custom";
  }, "History mode is set to custom");

  var showCookies = new elementslib.ID(controller.window.document, "showCookiesButton");
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
  var removeCookieButton = new elementslib.ID(controller.window.document, "removeCookie");
  controller.waitForElement(removeCookieButton);
  expect.ok(!removeCookieButton.getNode().disabled, "The Remove Cookie Button is disabled");

  var cookieExists = Services.cookies.cookieExists({host: persisted.hostName,
                                                    name: "litmus_1",
                                                    path: "/cookies/" });
  expect.ok(cookieExists, "The single cookie is saved.");

  var dtds = ["chrome://browser/locale/preferences/cookies.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  controller.keypress(null, cmdKey, {accelKey: true});
}

