/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var prefs = require("../../../lib/prefs");
var utils = require("../../../lib/utils");

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
