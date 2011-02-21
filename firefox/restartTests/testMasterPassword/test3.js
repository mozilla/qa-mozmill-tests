/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Anthony Hughes <ahughes@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Include required modules
var modalDialog = require("../../../shared-modules/modal-dialog");
var prefs = require("../../../shared-modules/prefs");


var setupModule = function(module) {
  controller = mozmill.getBrowserController();
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
