/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var teardownModule = function(module) {
  utils.closeContentAreaContextMenu(controller);
}

var testAccessPageInfo = function () {
  // Load web page with RSS feed
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  // Open context menu on the html element and select Page Info entry
  var content = new elementslib.ID(controller.tabs.activeTab, "content");
  controller.rightClick(content);
  controller.click(new elementslib.ID(controller.window.document, "context-viewinfo"));

  utils.handleWindow("type", "Browser:page-info", checkPageInfoWindow);
}

function checkPageInfoWindow(controller) {
  // List of all available panes inside the page info window
  var panes = [
               {button: 'generalTab', panel: 'generalPanel'},
               {button: 'mediaTab', panel: 'mediaPanel'},
               {button: 'feedTab', panel: 'feedListbox'},
               {button: 'permTab', panel: 'permPanel'},
               {button: 'securityTab', panel: 'securityPanel'}
              ];

  // Step through each of the tabs
  for each (var pane in panes) {
    var paneButton = new elementslib.ID(controller.window.document, pane.button);
    controller.click(paneButton);

    // Check if the panel has been shown
    var node = new elementslib.ID(controller.window.document, pane.panel);
    controller.waitForElement(node, TIMEOUT);
  }

  // Close the Page Info window by pressing Escape
  controller.keypress(null, 'VK_ESCAPE', {});
}

/**
 * Map test functions to litmus tests
 */
// testAccessPageInfo.meta = {litmusids : [8413]};
