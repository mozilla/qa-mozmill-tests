/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var toolbars = require("../../../lib/toolbars");

const TEST_PAGE = "http://www.mozilla.org/en-US/about/contact";

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  locationBar = new toolbars.locationBar(controller);
}

/**
 * Test the stop and reload buttons
 */
var testStopAndReload = function() {
  // Make sure we have a blank page
  controller.open("about:blank");
  controller.waitForPageLoad();

  // Go to the URL and start loading for some milliseconds
  controller.open(TEST_PAGE);
  var stopButton = locationBar.getElement({type: "stopButton"});
  controller.click(stopButton);

  // Even an element at the top of a page shouldn't exist when we hit the stop
  // button extremely fast
  var footer = new elementslib.ID(controller.tabs.activeTab, "footer-right");
  controller.assertNodeNotExist(footer);

  // Reload, wait for it to completely loading and test again
  controller.open(TEST_PAGE);
  controller.waitForPageLoad();

  footer = new elementslib.ID(controller.tabs.activeTab, "footer-right");
  controller.assertNode(footer);
}

/**
 * Map test functions to litmus tests
 */
// testStopAndReload.meta = {litmusids : [8030]};
