/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var prefWindow = require("../ui/pref-window");

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

var testPrefHelperClass = function () {
  prefWindow.openPreferencesDialog(controller, handlePrefDialog);
}

/**
 * Test the preferences dialog methods
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function handlePrefDialog(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  var pane = prefDialog.pane;
  prefDialog.paneId = 'paneContent';

  prefDialog.close(true);
}
