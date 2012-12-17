/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { assert } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

/**
 * Test that SSL and TLS are checked by default
 */
var testDefaultSecurityPreferences = function() {
  prefs.openPreferencesDialog(controller, prefDialogCallback);
}

/**
 * Call-back handler for preferences dialog
 */
var prefDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneAdvanced';

  // Get the Encryption tab
  var encryption = new elementslib.ID(controller.window.document, "encryptionTab");
  controller.waitThenClick(encryption, gTimeout);
  controller.sleep(gDelay);

  // Make sure the prefs are checked
  var sslPref = new elementslib.ID(controller.window.document, "useSSL3");
  var tlsPref = new elementslib.ID(controller.window.document, "useTLS1");
  controller.waitForElement(sslPref, gTimeout);
  assert.ok(sslPref.getNode().checked, "SSL3 Preferences checkbox is checked");
  assert.ok(tlsPref.getNode().checked, "TLS1 Preferences checkbox is checked");

  prefDialog.close();
}

