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

const TEST_DATA = [
  "http://domain1.mozqa.com/data/firefox/cookies/cookie_single.html",
  "http://domain2.mozqa.com/data/firefox/cookies/cookie_single.html"
];

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
}

/**
 * Test removing all cookies via the cookie manager
 */
var testRemoveAllCookies = function() {
  // Open cookie test page from different domains to build a list of cookies
  TEST_DATA.forEach(function(data) {
    controller.open(data);
    controller.waitForPageLoad();
  });

  // Call preferences dialog and delete the created cookies
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

  windows.handleWindow("type", "Browser:Cookies", deleteAllCookies);

  prefDialog.close(true);
}

/**
 * Delete all cookies
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function deleteAllCookies(aController) {
  // Get the amount of current cookies
  var cookiesList = aController.window.document.getElementById("cookiesList");
  assert.ok(cookiesList.view.rowCount > 0, "There are cookies in the list.");

  // Verify all cookies have been removed
  var removeAll = new elementslib.ID(aController.window.document, "removeAllCookies");
  aController.waitThenClick(removeAll);
  expect.equal(cookiesList.view.rowCount, 0, "There are no cookies left on the list");

  var dtds = ["chrome://browser/locale/preferences/cookies.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  aController.keypress(null, cmdKey, {accelKey: true});
}

