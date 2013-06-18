/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {expect} = require("../assertions");
var sessionStore = require("../sessionstore");
var tabs = require("../tabs");
var utils = require("../utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla_projects.html';

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();

  module.session = new sessionStore.aboutSessionRestore(controller);
  module.tabBrowser = new tabs.tabBrowser(controller);
}

var testAboutSessionRestoreErrorPage = function() {
  controller.open("about:sessionrestore");
  controller.sleep(400);

  // Test the list
  var list = session.getElement({type: "tabList"});
  var windows = session.getWindows();

  for (var ii = 0; ii < windows.length; ii++) {
    var window = windows[ii];
    var tabs = session.getTabs(window);

    for (var jj = 0; jj < tabs.length; jj++) {
      var tab = tabs[jj];

      if (jj == 0) {
        session.toggleRestoreState(tab);
      }
    }
  }

  // Test the buttons
  var button = session.getElement({type: "button_restoreSession"});
  expect.equal(button.getNode().getAttribute('oncommand'), "restoreSession();",
               "Restore Session button has the correct action");

  tabBrowser.openTab("shortcut");
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();
  tabBrowser.closeTab("shortcut");

  sessionStore.undoClosedTab(controller, {type: "shortcut"});
}
