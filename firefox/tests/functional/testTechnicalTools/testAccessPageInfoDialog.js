/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var utils = require("../../../../lib/utils");
var windows = require("../../../../lib/windows");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

var teardownModule = function(aModule) {
  utils.closeContentAreaContextMenu(aModule.controller);
}

var testAccessPageInfo = function () {
  // Load web page with RSS feed
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Open context menu on the html element and select Page Info entry
  var content = new elementslib.ID(controller.tabs.activeTab, "content");
  var contextMenu = controller.getMenu("#contentAreaContextMenu");
  contextMenu.select("#context-viewinfo", content);

  windows.handleWindow("type", "Browser:page-info", checkPageInfoWindow);
}

function checkPageInfoWindow(aController) {
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
    var paneButton = new elementslib.ID(aController.window.document, pane.button);
    aController.click(paneButton);

    // Check if the panel has been shown
    var node = new elementslib.ID(aController.window.document, pane.panel);
    aController.waitForElement(node);
  }

  // Close the Page Info window by pressing Escape
  aController.keypress(null, 'VK_ESCAPE', {});
}

