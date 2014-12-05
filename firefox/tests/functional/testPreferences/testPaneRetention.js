/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { expect } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");

var prefWindow = require("../../../lib/ui/pref-window");

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.lastSelectedPaneId = undefined;

  prefs.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
}

function teardownModule(aModule) {
  prefWindow.openPreferencesDialog(controller, prefPaneResetCallback);
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);
}

/**
 * Test the Preferences dialog retains state
 */
function testPreferencesDialogRetention() {
  // Choose the Privacy pane
  prefWindow.openPreferencesDialog(controller, prefPaneSetCallback);

  // And check if the Privacy pane is still selected
  prefWindow.openPreferencesDialog(controller, prefPaneCheckCallback);
}

/**
 * Select the Advanced and the Privacy pane
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function prefPaneSetCallback(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  prefDialog.paneId = 'paneAdvanced';
  prefDialog.paneId = 'panePrivacy';

  // Store actual paneId
  lastSelectedPaneId = prefDialog.paneId;
  prefDialog.close();
}

/**
 * The Privacy pane should still be selected
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function prefPaneCheckCallback(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  expect.waitFor(function () {
    return prefDialog.paneId === lastSelectedPaneId;
  }, "The privacy pane has been selected");
  prefDialog.close();
}

/**
 * Reset the current pane to the main options
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function prefPaneResetCallback(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  prefDialog.paneId = 'paneMain';
  prefDialog.close();
}
