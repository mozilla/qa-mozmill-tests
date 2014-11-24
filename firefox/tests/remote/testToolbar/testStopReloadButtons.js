/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert, expect } = require("../../../../lib/assertions");

var browser = require("../../../lib/ui/browser");

const TEST_DATA = "http://mozqa.com/data/firefox/layout/delayed_load.php?seconds=2";

var setupModule = function(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;
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
  controller.open(TEST_DATA);
  expect.waitFor(function () {
    return pageUnloaded;
  }, "about:blank page has been unloaded.", 2000, 10);

  var stopButton = locationBar.getElement({type: "stopButton"});
  controller.click(stopButton);

  // Even an element at the top of a page shouldn't exist when we hit the stop
  // button extremely fast
  var content = findElement.ID(controller.tabs.activeTab, "content");
  assert.ok(!content.exists(), "'content' element has not been found");

  // Reload, wait for it to completely loading and test again
  var reloadButton = locationBar.getElement({type: "reloadButton"});
  controller.click(reloadButton);
  controller.waitForPageLoad();

  content = findElement.ID(controller.tabs.activeTab, "content");
  assert.ok(content.exists(), "'content' element has been found");
}

