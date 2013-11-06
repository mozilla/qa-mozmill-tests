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
 * Tests removing a single cookie via the cookie manager
 */
var testRemoveCookie = function() {
  // Go to a test page to build a list of cookies
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the test page hostname
  persisted.hostName = controller.window.content.location.hostname;

  // Call preferences dialog and delete the created cookie
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

  utils.handleWindow("type", "Browser:Cookies", deleteCookie);

  prefDialog.close(true);
}

/**
 * Delete a cookie
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function deleteCookie(controller) {
  // Check for a cookie and delete it
  var filterField = new elementslib.ID(controller.window.document, "filter");
  controller.waitForElement(filterField);
  controller.type(filterField, "litmus_1");

  // Get the number of cookies in the file manager before removing a single cookie
  var cookiesList = controller.window.document.getElementById("cookiesList");
  var origNumCookies = cookiesList.view.rowCount;

  controller.click(new elementslib.ID(controller.window.document, "removeCookie"));

  var cookieRemoved = !Services.cookies.cookieExists({host: persisted.hostName,
                                                      name: "litmus_1",
                                                      path: "/cookies/" });
  expect.ok(cookieRemoved, "The cookie has been removed");
  expect.equal(cookiesList.view.rowCount, (origNumCookies - 1),
               "There is one less cookie than before");

  var dtds = ["chrome://browser/locale/preferences/cookies.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  controller.keypress(null, cmdKey, {accelKey: true});
}

