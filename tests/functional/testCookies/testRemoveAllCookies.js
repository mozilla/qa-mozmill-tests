/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Geo Mealer <gmealer@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

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
