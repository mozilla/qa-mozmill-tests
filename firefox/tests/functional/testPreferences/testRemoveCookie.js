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
 * Tests removing a single cookie via the cookie manager
 */
var testRemoveCookie = function() {
  // Go to a test page to build a list of cookies
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the test page hostname
  persisted.hostName = controller.window.content.location.hostname;

  // Call preferences dialog and delete the created cookie
  prefWindow.openPreferencesDialog(controller, prefDialogCallback);
}

/**
 * Open the cookie manager from the privacy pane
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);
  prefDialog.paneId = 'panePrivacy';

  // Go to custom history settings and click on the show cookies button
  var historyMode = new elementslib.ID(aController.window.document, "historyMode");
  aController.waitForElement(historyMode);
  aController.select(historyMode, null, null, "custom");
  assert.waitFor(function () {
    return historyMode.getNode().value === "custom";
  }, "History mode is set to custom");

  var showCookies = new elementslib.ID(aController.window.document, "showCookiesButton");
  aController.click(showCookies);

  windows.handleWindow("type", "Browser:Cookies", deleteCookie);

  prefDialog.close(true);
}

/**
 * Delete a cookie
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function deleteCookie(aController) {
  // Check for a cookie and delete it
  var filterField = new elementslib.ID(aController.window.document, "filter");
  aController.waitForElement(filterField);
  aController.type(filterField, "litmus_1");

  // Get the number of cookies in the file manager before removing a single cookie
  var cookiesList = aController.window.document.getElementById("cookiesList");

  // Wait for the cookie list to load
  assert.waitFor(() => (cookiesList.view.rowCount === 1),
                 "There is one item in the cookie list.");

  var origNumCookies = cookiesList.view.rowCount;

  var removeSelectedCookies = findElement.ID(aController.window.document,
                                             "removeSelectedCookies");
  removeSelectedCookies.click();

  var cookieRemoved = !Services.cookies.cookieExists({host: persisted.hostName,
                                                      name: "litmus_1",
                                                      path: "/cookies/" });
  expect.ok(cookieRemoved, "The cookie has been removed");
  expect.equal(cookiesList.view.rowCount, (origNumCookies - 1),
               "There is one less cookie than before");

  var dtds = ["chrome://browser/locale/preferences/cookies.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  aController.keypress(null, cmdKey, {accelKey: true});
}
