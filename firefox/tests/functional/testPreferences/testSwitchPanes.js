/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/**
 * Litmus test #8013: Main Menu of Options (Preferences)
 */

// Include the required modules
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");

var prefWindow = require("../../../lib/ui/pref-window");

const DELAY = 100;

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
 * Switching through all panes of the preferences dialog
 */
var testPreferencesPanes = function() {
  prefWindow.openPreferencesDialog(controller, prefDialogCallback);
}

/**
 * Callback handler for preferences window
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  // List of all available panes inside the Preferences window
  var panes = [
               "paneMain", "paneTabs", "paneContent", "paneApplications",
               "panePrivacy", "paneSecurity", "paneSync", "paneAdvanced"
              ];

  // Step through each of the panes
  panes.forEach(function (aPane) {
    prefDialog.paneId = aPane;
    aController.sleep(DELAY);
  });

  // Close the Preferences window
  prefDialog.close();
}

