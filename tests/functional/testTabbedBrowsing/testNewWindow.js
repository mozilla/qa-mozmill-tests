/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var utils = require("../../../lib/utils");

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  controller2 = null;
}

var teardownModule = function(module) {
  if (controller2 && controller2.window)
    controller2.window.close();
}

/**
 * Test the opening of a new window
 */
var testNewWindow = function () {
  // Ensure current tab does not have the home page loaded
  controller.open('about:blank');
  controller.waitForPageLoad();

  // Open a new window
  controller.mainMenu.click("#menu_newNavigator");

  controller.waitFor(function () {
    // Make sure that we work on the correct window
    var windows = mozmill.utils.getWindows("navigator:browser");
    for (var i = 0; i < windows.length; i++) {
      if (windows[i] !== controller.window) {
        controller2 = new mozmill.controller.MozMillController(windows[i]);
        break;
      }
    }

    return !!controller2;
  }, "Newly opened browser window has not been found");

  checkDefaultHomepage(controller2);
}

/**
 * Check if the default homepage has been opened
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function checkDefaultHomepage(controller) {
  var defaultHomepage = utils.getDefaultHomepage();

  controller.waitForPageLoad();
  utils.assertLoadedUrlEqual(controller, defaultHomepage);
}

/**
 * Map test functions to litmus tests
 */
// testNewWindow.meta = {litmusids : [7954]};
