/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var prefs = require("../firefox/lib/prefs");

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

// Setup for the test
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

// Run the preferences dialog test
var testSampleTestcase = function() {
  prefs.openPreferencesDialog(controller, callbackHandler);
}

var callbackHandler = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneMain';

  // Code to be executed in the preferences dialog

  prefDialog.close(true);
}
