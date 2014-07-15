/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var { assert, expect } = require("../../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var utils = require("../../../lib/utils");

const TEST_DATA = [
  "http://domain1.mozqa.com/data/firefox/cookies/cookie_single.html",
  "http://domain2.mozqa.com/data/firefox/cookies/cookie_single.html"
];

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  Services.cookies.removeAll();
}

var teardownModule = function(aModule) {
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
  prefs.openPreferencesDialog(controller, prefDialogCallback);
}

/**
 * Open the cookie manager from the privacy pane
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'panePrivacy';

  // Go to custom history settings and click on the show cookies button
  var historyMode = new elementslib.ID(controller.window.document, "historyMode");
  controller.waitForElement(historyMode);
  controller.select(historyMode, null, null, "custom");
  assert.waitFor(function () {
    return historyMode.getNode().value === "custom";
  }, "History mode is set to custom");

  var showCookies = new elementslib.ID(controller.window.document, "showCookiesButton");
  controller.click(showCookies);

  utils.handleWindow("type", "Browser:Cookies", deleteAllCookies);

  prefDialog.close(true);
}

/**
 * Delete all cookies
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function deleteAllCookies(controller) {
  // Get the amount of current cookies
  var cookiesList = controller.window.document.getElementById("cookiesList");
  assert.ok(cookiesList.view.rowCount > 0, "There are cookies in the list.");

  // Verify all cookies have been removed
  var removeAll = new elementslib.ID(controller.window.document, "removeAllCookies");
  controller.waitThenClick(removeAll);
  expect.equal(cookiesList.view.rowCount, 0, "There are no cookies left on the list");

  var dtds = ["chrome://browser/locale/preferences/cookies.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  controller.keypress(null, cmdKey, {accelKey: true});
}

