/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");


var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

var teardownModule = function(aModule) {
  // Bug 886811
  // Mozmill 1.5 does not have the stopApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("stopApplication" in aModule.controller) {
    aModule.controller.stopApplication(true);
  }
}

/**
 * Test removing the master password
 */
var testRemoveMasterPassword = function() {
  // Call preferences dialog and invoke master password functionality
  prefs.openPreferencesDialog(controller, deleteMasterPassword);
}

/**
 * Delete the master password using the preferences window
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var deleteMasterPassword = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);

  prefDialog.paneId = 'paneSecurity';

  var masterPasswordCheck = new elementslib.ID(controller.window.document, "useMasterPassword");
  controller.waitForElement(masterPasswordCheck);

  // Call setMasterPassword dialog and remove the master password to your profile
  var md = new modalDialog.modalDialog(controller.window);
  md.start(removeMasterHandler);

  controller.click(masterPasswordCheck);
  md.waitForDialog();

  // Close the Preferences dialog
  prefDialog.close(true);
}

/**
 * Remove the master password via the master password dialog
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var removeMasterHandler = function(controller) {
  var removePwdField = new elementslib.ID(controller.window.document, "password");

  controller.waitForElement(removePwdField);
  controller.type(removePwdField, "test1");

  // Call the confirmation dialog and click ok to go back to the preferences dialog
  var md = new modalDialog.modalDialog(controller.window);
  md.start(confirmHandler);

  controller.click(new elementslib.Lookup(controller.window.document,
                   '/id("removemp")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}'));
  md.waitForDialog();
}

/**
 * Call the confirmation dialog and click ok to go back to the preferences dialog
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var confirmHandler = function(controller) {
  var button = new elementslib.Lookup(controller.window.document,
                               '/id("commonDialog")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}');
  controller.waitThenClick(button);
}
