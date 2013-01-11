/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { assert, expect } = require("../../../lib/assertions");
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

  var pageUnloaded = false;
  var contentWindow = controller.tabs.activeTab.defaultView;

  function onUnload() {
    contentWindow.removeEventListener("unload", onUnload, false);
    pageUnloaded = true;
  }

  // Make sure we have a blank page
  controller.open("about:blank");
  controller.waitForPageLoad();

  // Add event handler to the current page so we can wait for it to unload
  contentWindow.addEventListener("unload", onUnload, false);

  // Go to the URL and start loading for some milliseconds
  controller.open(TEST_PAGE);
  expect.waitFor(function () {
    return pageUnloaded;
  }, "about:blank page has been unloaded.");

  var stopButton = locationBar.getElement({type: "stopButton"});
  controller.click(stopButton);

  // Even an element at the top of a page shouldn't exist when we hit the stop
  // button extremely fast
  var footer = new elementslib.ID(controller.tabs.activeTab, "footer-right");
  assert.ok(!footer.exists(), "'Footer' element has not been found");

  // Reload, wait for it to completely loading and test again
  var reloadButton = locationBar.getElement({type: "reloadButton"});
  controller.click(reloadButton);
  controller.waitForPageLoad();

  footer = new elementslib.ID(controller.tabs.activeTab, "footer-right");
  assert.ok(footer.exists(), "'Footer' element has been found");
}

/**
 * Map test functions to litmus tests
 */
// testStopAndReload.meta = {litmusids : [8030]};
