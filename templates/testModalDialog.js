/** Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

// Include necessary modules
const RELATIVE_ROOT = '../../shared-modules';
const MODULE_REQUIRES = ['ModalDialogAPI'];

const TIMEOUT = 5000;

var setupModule = function() {
  controller = mozmill.getBrowserController();
}

var testSampleTestcase = function() {
  var md = new ModalDialogAPI.modalDialog(callbackHandler);
  md.start();

  // Code that opens a modal dialog, e.g. click or keypress
}

var callbackHandler = function(controller) {
  // Code to be executed in the modal dialog
  
}

