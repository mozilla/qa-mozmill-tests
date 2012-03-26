/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var Toolbars = require("../../../lib/toolbars");

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  locationBar =  new Toolbars.locationBar(controller);
}

/**
 * Test the stop and reload buttons
 */
var testStopAndReload = function()
{
  var url = "http://www.mozilla.com/en-US/";

  // Make sure we have a blank page
  controller.open("about:blank");
  controller.waitForPageLoad();

  // Go to the URL and start loading for some milliseconds
  controller.open(url);
  var stopButton = locationBar.getElement({type: "stopButton"});
  controller.click(stopButton);

  // Even an element at the top of a page shouldn't exist when we hit the stop
  // button extremely fast
  var header = new elementslib.ID(controller.tabs.activeTab, "header");
  controller.assertNodeNotExist(header);

  // Reload, wait for it to completely loading and test again
  controller.open(url);
  controller.waitForPageLoad();

  header = new elementslib.ID(controller.tabs.activeTab, "header");
  controller.waitForElement(header);
  controller.assertNode(header);
}

/**
 * Map test functions to litmus tests
 */
// testStopAndReload.meta = {litmusids : [8030]};
