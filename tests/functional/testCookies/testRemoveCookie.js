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
 *   Aaron Train <atrain@mozilla.com>
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
var prefs = require("../../../lib/prefs");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'cookies/cookie_single.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();

  cm = Cc["@mozilla.org/cookiemanager;1"].
       getService(Ci.nsICookieManager2);
  cm.removeAll();
}

var teardownModule = function() {
  cm.removeAll();
  persisted.hostName = undefined;
}

/**
 * Tests removing a single cookie via the cookie manager
 */
var testRemoveCookie = function() {
  // Go to a test page to build a cookie
  controller.open(LOCAL_TEST_PAGE);
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

  // The Show Cookies button doesn't receive focus that fast. Means a click will
  // fail if sent too early. There is no property we can check so far. So lets
  // use a sleep call for now.
  var showCookies = new elementslib.ID(controller.window.document, "showCookiesButton");
  controller.sleep(500);
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
  controller.waitForElement(filterField, TIMEOUT);
  controller.type(filterField, "litmus_1");
  controller.sleep(500);

  // Get the number of cookies in the file manager before removing a single cookie
  var cookiesList = controller.window.document.getElementById("cookiesList");
  var origNumCookies = cookiesList.view.rowCount;

  controller.click(new elementslib.ID(controller.window.document, "removeCookie"));

  var removed = !cm.cookieExists({
    host: persisted.hostName, 
    name: "litmus_1", 
    path: "/cookies/"
  });
  
  controller.assertJS("subject.isCookieRemoved == true", {
    isCookieRemoved: removed
  });
  
  controller.assertJS("subject.list.view.rowCount == subject.numberCookies", {
    list: cookiesList,
    numberCookies: origNumCookies - 1
  });

  var dtds = ["chrome://browser/locale/preferences/cookies.dtd"];
  var cmdKey = utils.getEntity(dtds, "windowClose.key");
  controller.keypress(null, cmdKey, {accelKey: true});
}


/**
 * Map test functions to litmus tests
 */
// testRemoveCookie.meta = {litmusids : [6013]};
