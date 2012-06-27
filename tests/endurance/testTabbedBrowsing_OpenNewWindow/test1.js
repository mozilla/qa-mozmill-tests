/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
// Include the required modules
var {assert} = require("../../../lib/assertions");
var endurance = require("../../../lib/endurance");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");
 
function setupModule() {
  controller = mozmill.getBrowserController();
  enduranceManager = new endurance.EnduranceManager(controller);
 
  tabBrowser = new tabs.tabBrowser(controller);
}
 
function teardownModule() {
  tabBrowser.closeAllTabs();
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
      controller.waitFor(function () {
        var windows = mozmill.utils.getWindows("navigator:browser");

        return (windows.length === controllers.length + 2);
      }, "Window number '" + enduranceManager.currentEntity + "' has been opened");

      var currentWindow = mozmill.wm.getMostRecentWindow("navigator:browser");
      var currentController = mozmill.getBrowserController();
      controllers.push(currentController);
      enduranceManager.addCheckpoint("A new window has been opened");
    });
    
    enduranceManager.loop(function () {
      enduranceManager.addCheckpoint("Close a window");      
      var currentEntity = enduranceManager.currentEntity;
      var controller = controllers[currentEntity - 1];
      var windowId = mozmill.utils.getWindowId(controller.window);

      controller.window.close();
      controller.waitFor(function () {
        return !mozmill.controller.windowMap.contains(windowId);
      }, "Window '" + windowId + "' has been closed.");     
      enduranceManager.addCheckpoint("Window '" + windowId + "' has been closed");
    });
  });
}
