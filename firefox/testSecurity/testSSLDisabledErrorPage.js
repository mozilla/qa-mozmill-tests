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
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Anthony Hughes <ashughes@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
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

// Include the required modules
var prefs = require("../../shared-modules/prefs");
var utils = require("../../shared-modules/utils");

const gDelay = 0;
const gTimeout = 5000;

// TODO: move the dtds to a SecurityAPI, if one will be created
const dtds = ["chrome://browser/locale/netError.dtd"];
const property = "chrome://pipnss/locale/pipnss.properties";

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  
  // XXX: Bug 513129
  //      Disable Keep-alive connections
  prefs.preferences.setPref("network.http.keep-alive", false);
}

var teardownModule = function(module) {
  // Reset the SSL and TLS pref
  prefs.preferences.clearUserPref("security.enable_ssl3");
  prefs.preferences.clearUserPref("security.enable_tls");
  
  // XXX: Bug 513129
  //      Re-enable Keep-alive connections
  prefs.preferences.clearUserPref("network.http.keep-alive");
}

/**
 * Test that SSL and TLS are checked by default
 *
 */
var testDisableSSL = function() {
  // Open a blank page so we don't have any error page shown
  controller.open("about:blank");
  controller.waitForPageLoad();

  prefs.openPreferencesDialog(controller, prefDialogCallback);

  controller.open("https://mail.mozilla.org");
  controller.waitForPageLoad();

  // Verify "Secure Connection Failed" error page title
  var title = new elementslib.ID(controller.tabs.activeTab, "errorTitleText");
  controller.waitForElement(title, gTimeout);

  var nssFailure2title = utils.getEntity(dtds, "nssFailure2.title")
  controller.assert(function () {
    return title.getNode().textContent === nssFailure2title;
  }, "The correct SSL error title is shown - got '" + title.getNode().textContent +
    "', expected '" + nssFailure2title + "'");

  // Verify "Try Again" button appears
  var tryAgain = new elementslib.ID(controller.tabs.activeTab, "errorTryAgain");
  controller.assertNode(tryAgain);

  // Verify the error message is correct
  var text = new elementslib.ID(controller.tabs.activeTab, "errorShortDescText");
  controller.waitForElement(text, gTimeout);
  controller.assert(function () {
    return text.getNode().textContent.indexOf('ssl_error_ssl_disabled') != -1;
  }, "The SSL error message contains 'ssl_error_ssl_disabled' - got '" +
    text.getNode().textContent + "'");

  controller.assert(function () {
    return text.getNode().textContent.indexOf('mail.mozilla.org') != -1;
  }, "The SSL error message contains 'mail.mozilla.org' - got '" +
    text.getNode().textContent + "'");

  var PSMERR_SSL_Disabled = utils.getProperty(property, 'PSMERR_SSL_Disabled');
  controller.assert(function () {
    return text.getNode().textContent.indexOf(PSMERR_SSL_Disabled) != -1;
  }, "The SSL error message contains '" + PSMERR_SSL_Disabled + "' - got '" +
    text.getNode().textContent + "'");
}

/**
 * Disable SSL 3.0 and TLS for secure connections
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneAdvanced';

  // Get the Encryption tab
  var encryption = new elementslib.ID(controller.window.document, "encryptionTab");
  controller.waitThenClick(encryption, gTimeout);
  controller.sleep(gDelay);

  // Make sure the Use SSL pref is not checked
  var sslPref = new elementslib.ID(controller.window.document, "useSSL3");
  controller.waitForElement(sslPref, gTimeout);
  controller.check(sslPref, false);

  // Make sure the Use TLS pref is not checked
  var tlsPref = new elementslib.ID(controller.window.document, "useTLS1");
  controller.waitForElement(tlsPref, gTimeout);
  controller.check(tlsPref, false);

  prefDialog.close(true);
}

/**
 * Map test functions to litmus tests
 */
// testDisableSSL.meta = {litmusids : [9345]};
