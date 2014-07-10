/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/**
 * Litmus test #8013: Main Menu of Options (Preferences)
 */

// Include the required modules
var prefs = require("../../../lib/prefs");
var utils = require("../../../../lib/utils");

const DELAY = 100;

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  prefs.preferences.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.preferences.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
}

function teardownModule(aModule) {
  prefs.preferences.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.preferences.clearUserPref(PREF_BROWSER_INSTANT_APPLY);
}

/**
 * Switching through all panes of the preferences dialog
 */
var testPreferencesPanes = function() {
  prefs.openPreferencesDialog(controller, prefDialogCallback);
}

/**
 * Callback handler for preferences window
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);

  // List of all available panes inside the Preferences window
  var panes = [
               "paneMain", "paneTabs", "paneContent", "paneApplications",
               "panePrivacy", "paneSecurity", "paneSync", "paneAdvanced"
              ];

  // Step through each of the panes
  panes.forEach(function (pane) {
    prefDialog.paneId = pane;
    controller.sleep(DELAY);
  });

  // Close the Preferences window
  prefDialog.close();
}

