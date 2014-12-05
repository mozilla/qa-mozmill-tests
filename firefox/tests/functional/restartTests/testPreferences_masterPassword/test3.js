/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var modalDialog = require("../../../../../lib/modal-dialog");
var prefs = require("../../../../../lib/prefs");

var prefWindow = require("../../../../lib/ui/pref-window");

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  prefs.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
}

var teardownModule = function(aModule) {
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);

  aModule.controller.stopApplication(true);
}

/**
 * Test removing the master password
 */
var testRemoveMasterPassword = function() {
  // Call preferences dialog and invoke master password functionality
  prefWindow.openPreferencesDialog(controller, deleteMasterPassword);
}

/**
 * Delete the master password using the preferences window
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var deleteMasterPassword = function(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  prefDialog.paneId = 'paneSecurity';

  var masterPasswordCheck = new elementslib.ID(aController.window.document, "useMasterPassword");
  aController.waitForElement(masterPasswordCheck);

  // Call setMasterPassword dialog and remove the master password to your profile
  var md = new modalDialog.modalDialog(aController.window);
  md.start(removeMasterHandler);

  aController.click(masterPasswordCheck);
  md.waitForDialog();

  // Close the Preferences dialog
  prefDialog.close(true);
}

/**
 * Remove the master password via the master password dialog
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var removeMasterHandler = function(aController) {
  var removePwdField = new elementslib.ID(aController.window.document, "password");

  aController.waitForElement(removePwdField);
  aController.type(removePwdField, "test1");

  // Call the confirmation dialog and click ok to go back to the preferences dialog
  var md = new modalDialog.modalDialog(aController.window);
  md.start(confirmHandler);

  aController.click(new elementslib.Lookup(aController.window.document,
                   '/id("removemp")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}'));
  md.waitForDialog();
}

/**
 * Call the confirmation dialog and click ok to go back to the preferences dialog
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
var confirmHandler = function(aController) {
  var button = new elementslib.Lookup(aController.window.document,
                               '/id("commonDialog")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  aController.waitThenClick(button);
}
