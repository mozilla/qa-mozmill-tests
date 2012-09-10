/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { assert, expect } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var utils = require("../../../lib/utils");

const TEST_DOMAINS = ["http://domain1.mozqa.com",
                      "http://domain2.mozqa.com"];
const TEST_PAGE = "/data/firefox/cookies/cookie_single.html";

var setupModule = function(module) {
  controller = mozmill.getBrowserController();

  module.cm = Cc["@mozilla.org/cookiemanager;1"]
                 .getService(Ci.nsICookieManager2);
  cm.removeAll();
}

/**
 * Test removing all cookies via the cookie manager
 */
var testRemoveAllCookies = function() {
  // Open cookie test page from different domains to build a list of cookies
  TEST_DOMAINS.forEach(function(domain) {
    controller.open(domain + TEST_PAGE);
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

  // The Show Cookies button doesn't receive focus that fast. Means a click will
  // fail if sent too early. There is no property we can check so far. So lets
  // use a sleep call for now.
  var showCookies = new elementslib.ID(controller.window.document, "showCookiesButton");
  controller.sleep(500);
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

/**
 * Map test functions to litmus tests
 */
// testRemoveAllCookies.meta = {litmusids : [8054]};
