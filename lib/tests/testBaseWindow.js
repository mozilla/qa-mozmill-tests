/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var baseWindow = require("../ui/base-window");
var utils = require("../utils");
var windows = require("../windows");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function teardownModule(aModule) {
  windows.closeAllWindows(aModule.controller);
}

function testBaseWindow() {
  var length = mozmill.utils.getWindows().length;

  var win1 = openNewWindow();
  expect.equal(mozmill.utils.getWindows().length, length + 1,
               "Window has been opened");

  win1.close();
  expect.equal(mozmill.utils.getWindows().length, length,
               "Window has been closed");

  // Open 5 more windows
  var win2 = openNewWindow();
  var win3 = openNewWindow();
  var win4 = openNewWindow();
  var win5 = openNewWindow();
  var win6 = openNewWindow();
  expect.equal(mozmill.utils.getWindows().length, length + 5,
               "5 windows have been opened");

  windows.closeAllWindows(new baseWindow.BaseWindow(controller));

  expect.equal(mozmill.utils.getWindows().length, length,
               "All windows except the browser window have been closed");

  // Test the OS X behavior and close the browser window too
  if (mozmill.isMac) {
    windows.closeAllWindows();

    expect.equal(mozmill.utils.getWindows().length, length - 1,
               "All windows were closed");
  }
}

// Bug 1047235
// Add BrowserWindow class & function to open this type of windows
// Move this to the shared library
/**
 * Open a new window
 *
 * @returns {BaseWindow} New window object
 */
function openNewWindow() {
  var newController = windows.waitForWindowState(() => {
    controller.mainMenu.click("#menu_newNavigator");
  }, {state: "open", type: "navigator:browser"});

  return new baseWindow.BaseWindow(newController);
}
