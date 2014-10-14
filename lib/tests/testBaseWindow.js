/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var utils = require("../utils");
var windows = require("../windows");

var baseWindow = require("../ui/base-window");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.baseWindow = new baseWindow.BaseWindow(controller);
}

function teardownModule(aModule) {
  windows.closeAllWindows(aModule.controller);
}

function testBaseWindow() {
  var length = mozmill.utils.getWindows().length;

  var win1 = baseWindow.open();
  expect.equal(mozmill.utils.getWindows().length, length + 1,
               "Window has been opened");

  win1.close();
  expect.equal(mozmill.utils.getWindows().length, length,
               "Window has been closed");

  // Open 5 more windows
  var win2 = baseWindow.open();
  var win3 = baseWindow.open();
  var win4 = baseWindow.open();
  var win5 = baseWindow.open();
  var win6 = baseWindow.open();
  expect.equal(mozmill.utils.getWindows().length, length + 5,
               "5 windows have been opened");

  // Open a new window and test waiting for it using the id
  windows.waitForWindowState(() => {
    controller.mainMenu.click("#menu_newNavigator");
  }, {state: "open", id: "main-window"});

  windows.closeAllWindows(baseWindow);

  expect.equal(mozmill.utils.getWindows().length, length,
               "All windows except the browser window have been closed");

  // Test the OS X behavior and close the browser window too
  if (mozmill.isMac) {
    windows.closeAllWindows();

    expect.equal(mozmill.utils.getWindows().length, length - 1,
               "All windows were closed");
  }
}
