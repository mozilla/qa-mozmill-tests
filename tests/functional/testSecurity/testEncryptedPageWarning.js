/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { assert, expect } = require("../../../lib/assertions");
var modalDialog = require("../../../lib/modal-dialog");
var prefs = require("../../../lib/prefs");
var tabbedbrowser = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const TIMEOUT_MODAL_DIALOG = 30000;

var gPreferences = new Array("security.warn_entering_secure",
                             "security.warn_entering_weak",
                             "security.warn_leaving_secure",
                             "security.warn_submit_insecure",
                             "security.warn_viewing_mixed");

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  tabbedbrowser.closeAllTabs(controller);
}

var teardownModule = function(module) {
  for each (p in gPreferences)
    prefs.preferences.clearUserPref(p);
}

/**
 * Test warning about viewing an encrypted page
 */
var testEncryptedPageWarning = function() {
  // Enable the 'warn_entering_secure' pref only
  for (var i = 0; i < gPreferences.length; i++)
    prefs.preferences.setPref(gPreferences[i], (i == 0));

  // Create a listener for the warning dialog
  var md = new modalDialog.modalDialog(controller.window .window);
  md.start(handleSecurityWarningDialog);

  // Load an encrypted page and wait for the security alert
  controller.open("https://mail.mozilla.org");
  md.waitForDialog(TIMEOUT_MODAL_DIALOG);
}

/**
 * Helper function to handle interaction with the Security Warning modal dialog
 */
var handleSecurityWarningDialog = function(controller) {
  var enterSecureMessage = utils.getProperty("chrome://pipnss/locale/security.properties",
                                             "EnterSecureMessage");

  // Wait for the content to load
  var infoBody = new elementslib.ID(controller.window.document, "info.body");
  controller.waitForElement(infoBody);

  expect.equal(infoBody.getNode().textContent, enterSecureMessage,
               "Secure message content is present and correct");

  // Verify the "Alert me whenever" checkbox is checked by default
  var checkbox = new elementslib.ID(controller.window.document, "checkbox");
  controller.assertChecked(checkbox);

  // Click the OK button
  var okButton = new elementslib.Lookup(controller.window.document,
                                        '/id("commonDialog")' +
                                        '/anon({"anonid":"buttons"})' +
                                        '/{"dlgtype":"accept"}');
  controller.waitThenClick(okButton);
}
