/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var utils = require("../../../../lib/utils");

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.controller2 = null;
}

var teardownModule = function(aModule) {
  if (aModule.controller2 && aModule.controller2.window)
    aModule.controller2.window.close();
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

  assert.waitFor(function () {
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
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function checkDefaultHomepage(aController) {
  var defaultHomepage = utils.getDefaultHomepage();

  aController.waitForPageLoad();
  utils.assertLoadedUrlEqual(aController, defaultHomepage);
}

