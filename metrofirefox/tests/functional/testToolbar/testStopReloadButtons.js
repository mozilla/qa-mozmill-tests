/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var tabs = require("../../../lib/ui/tabs");
var toolbars = require("../../../lib/ui/toolbars");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabs = new tabs.TabBrowser(aModule.controller);
  aModule.toolBar = new toolbars.ToolBar(aModule.controller);
}

function teardownModule(aModule) {
  tabs.closeAllTabs(controller);
}

/**
 * Bug 924074: Test the stop and reload methods
 */
function testStopReloadButtons() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Variable to store the unload event state
  var pageUnloaded = false;
  function onUnload() {
    pageUnloaded = true;
  }

  var contentElement = new elementslib.ID(controller.tabs.activeTab, "organization");
  var contentWindow = controller.tabs.activeTab.defaultView;
  contentWindow.addEventListener("unload", onUnload);

  try {
    controller.open(TEST_DATA);
    assert.waitFor(function () {
      return pageUnloaded;
    }, "Web page has been unloaded", 2000, 10);
  }
  finally {
    contentWindow.removeEventListener("unload", onUnload);
  }

  // An element on page shouldn't exist when we stop the page loading very fast
  toolBar.locationBar.stop({aEventType: "button"});
  assert.ok(!contentElement.exists(), "'contentElement' does not exist");

  toolBar.locationBar.reload({aEventType: "button"});
  controller.waitForPageLoad();
  assert.ok(contentElement.exists(), "'contentElement' exists");
}
