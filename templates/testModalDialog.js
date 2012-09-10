/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
const RELATIVE_ROOT = '../../lib';
const MODULE_REQUIRES = ['ModalDialogAPI'];

const TIMEOUT = 5000;

var setupModule = function() {
  controller = mozmill.getBrowserController();
}

var testSampleTestcase = function() {
  var md = new ModalDialogAPI.modalDialog(controller);
  md.start(callbackHandler);

  // Code that opens a modal dialog, e.g. click or keypress
  // controller.click(...)

  // Wait for the dialog
  md.waitForDialog();
}

var callbackHandler = function(controller) {
  // Code to be executed in the modal dialog

}
