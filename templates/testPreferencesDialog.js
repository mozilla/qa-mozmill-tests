/** Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

// Include necessary modules
const RELATIVE_ROOT   = '../../shared-modules';
const MODULE_REQUIRES = ['PrefsAPI', 'UtilsAPI'];

const TIMEOUT = 5000;

var setupModule = function() {
  controller = mozmill.getBrowserController();
}

var testSampleTestcase = function() {
  PrefsAPI.openPreferencesDialog(callbackHandler);
}

var callbackHandler = function(controller) {
  var prefDialog = new PrefsAPI.preferencesDialog(controller);
  prefDialog.paneId = 'paneMain';

  // Code to be executed in the preferences dialog

  prefDialog.close(true);
}
