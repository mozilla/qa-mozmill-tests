/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");

// Include required modules
var baseWindow = require("../ui/base-window");
var utils = require("../utils");
var windows = require("../windows");

const DTDS = [
  "chrome://browser/locale/browser.dtd",
  "chrome://browser/locale/aboutPrivateBrowsing.dtd",
  "chrome://browser/locale/places/places.dtd"
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function teardownModule(aModule) {
  windows.closeAllWindows(aModule.controller);
}

function testOpenMultipleWindows() {
  // Open two windows of the same type
  var cmdKey1 = utils.getEntity(DTDS, "newNavigatorCmd.key");
  var cmdKey2 = utils.getEntity(DTDS, "privateBrowsingCmd.commandkey");

  var newController = windows.waitForWindowState(() => {
    controller.keypress(null, cmdKey1, {accelKey: true});
    controller.keypress(null, cmdKey2, {accelKey: true, shiftKey: true});
  }, {state: "open", type: "navigator:browser"});

  // Controller should handle the first window
  expect.ok(!PrivateBrowsingUtils.isWindowPrivate(newController.window),
            "The right window is handled");

  windows.closeAllWindows(controller.window);

  // Open two windows with different type but handle only the second one
  if (mozmill.isLinux) {
    cmdKey2 = utils.getEntity(DTDS, "bookmarksGtkCmd.commandkey");
  }
  else {
    cmdKey2 = utils.getEntity(DTDS, "bookmarksCmd.commandkey");
  }

  newController = windows.waitForWindowState(() => {
    controller.keypress(null, cmdKey2, {accelKey: true, shiftKey: true});
    controller.keypress(null, cmdKey1, {accelKey: true});
  }, {state: "open", type: "navigator:browser"});

  // Controller should handle the second window
  var windowType = newController.window.document.documentElement.getAttribute("windowtype");
  expect.equal(windowType, "navigator:browser", "The right window is handled");

  windows.closeAllWindows(controller.window);
}
