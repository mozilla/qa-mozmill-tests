/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var prefs = require("../prefs");

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testPrefHelperClass = function () {
  prefs.openPreferencesDialog(controller, handlePrefDialog);
}

/**
 * Test the preferences dialog methods
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function handlePrefDialog(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);

  var pane = prefDialog.pane;
  prefDialog.paneId = 'paneContent';

  prefDialog.close(true);
}
