/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var {assert} = require("../../../../lib/assertions");
var endurance = require("../../../../lib/endurance");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);
}

function teardownModule(aModule) {
  aModule.tabBrowser.closeAllTabs();
}

/**
* Test opening new windows
*/
function testOpenAndCloseMultipleWindows() {
  enduranceManager.run(function () {
    var controllers = [];

    enduranceManager.loop(function () {
      enduranceManager.addCheckpoint("Open a new window");
      controller.mainMenu.click("#menu_newNavigator");
      assert.waitFor(function () {
        var windows = mozmill.utils.getWindows("navigator:browser");

        return (windows.length - 1) === enduranceManager.currentEntity;
      }, "Window number '" + enduranceManager.currentEntity + "' has been opened");

      controllers.push(mozmill.getBrowserController());
      enduranceManager.addCheckpoint("A new window has been opened");
    });

    enduranceManager.loop(function () {
      enduranceManager.addCheckpoint("Close a window");
      var controller = controllers[enduranceManager.currentEntity - 1];
      var windowId = mozmill.utils.getWindowId(controller.window);

      controller.window.close();

      assert.waitFor(function () {
        return !mozmill.controller.windowMap.contains(windowId);
      }, "Window '" + windowId + "' has been closed.");
      enduranceManager.addCheckpoint("Window '" + windowId + "' has been closed");
    });
  });
}

