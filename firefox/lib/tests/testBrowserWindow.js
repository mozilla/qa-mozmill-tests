/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var browser = require("../ui/browser");
var windows = require("../../../lib/windows");

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
}

function teardownModule(aModule) {
  browserWindow.tabs.closeAllTabs();
  windows.closeAllWindows(aModule.browserWindow);
}

function testBrowserWindow() {
  assert.ok(!browserWindow.closed, "Default browser window is not closed");

  // Open default windows
  var defaultWindow1 = browserWindow.open({private: false,
                                           method: "shortcut"});
  var defaultWindow2 = browserWindow.open({method: "menu"});

  // Check that they are not private
  expect.ok(!defaultWindow1.private, "Browser window is not private");
  expect.ok(!defaultWindow2.private, "Browser window is not private");

  // Close the recently opened windows
  defaultWindow1.close();
  defaultWindow2.close();

  expect.ok(defaultWindow1.closed, "Browser window has been closed");
  expect.ok(defaultWindow2.closed, "Browser window has been closed");

  // Open private windows
  var privateWindow1 = browserWindow.open({private: true,
                                           method: "shortcut"});
  var privateWindow2 = browserWindow.open({private: true,
                                           method: "menu"});

  // Check they are private
  expect.ok(privateWindow1.private, "Browser window is private");
  expect.ok(privateWindow2.private, "Browser window is private");

  // Close the windows
  privateWindow1.close();
  privateWindow2.close();

  // Open some tabs on the window
  var length = browserWindow.tabs.length;

  browserWindow.tabs.openTab();
  browserWindow.tabs.openTab();

  expect.equal(browserWindow.tabs.length,
               length + 2,
               "Tabs have been successfully open");
}
