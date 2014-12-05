/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { expect } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");

var prefWindow = require("../../../lib/ui/pref-window");

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  prefs.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);
}

/**
 * Verify phishing detection is enabled
 */
var testDefaultPhishingEnabled = function() {
  prefWindow.openPreferencesDialog(controller, prefPaneSetCallback);
}

/**
 * Check that phishing checkboxes are enabled
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var prefPaneSetCallback = function(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);
  prefDialog.paneId = 'paneSecurity';

  // Check if the Security pane is active
  var attackElem = new elementslib.ID(aController.window.document, "blockAttackSites");
  var forgeryElem = new elementslib.ID(aController.window.document, "blockWebForgeries");

  // Verify Block Attack Sites and Reported Web Forgeries are checked by default
  aController.waitForElement(attackElem);
  expect.ok(attackElem.getNode().checked, "Block Attack Sites checkbox is checked");
  expect.ok(forgeryElem.getNode().checked, "Reported Web Forgeries checkbox is checked");

  prefDialog.close();
}
