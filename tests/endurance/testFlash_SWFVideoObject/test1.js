/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var addons = require("../../../lib/addons");
var endurance = require("../../../lib/endurance");
var tabs = require("../../../lib/tabs");

const TEST_DATA = "http://www.mozqa.com/data/firefox/plugins/flash/" +
                  "test_swf_object_nosound.html";

const TIMEOUT_PAGE = 50000;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  tabs.closeAllTabs(aModule.controller);

  // Skip test if we don't have Flash plugin enabled
  var isFlashActive = addons.getInstalledAddons(function (aAddon) {
    if (aAddon.isActive && aAddon.type === "plugin" && aAddon.name === "Shockwave Flash")
      return true;
  });

  if (isFlashActive[0] !== true) {
    testFlashObject.__force_skip__ = "No enabled Flash plugin detected";
  }
}

function teardownModule(aModule) {
  aModule.tabBrowser.closeAllTabs();
}

/*
 * Test opening flash content loaded via object
 */
function testFlashObject() {
  enduranceManager.run(function () {
    enduranceManager.loop(function () {
      // If entity > 1 then open a new tab
      if (enduranceManager.currentEntity > 1) {
        tabBrowser.openTab();
      }

      // Load the test page in the currently opened tab
      enduranceManager.addCheckpoint("Load a web page with flash content loaded via object");
      controller.open(TEST_DATA);
      controller.waitForPageLoad(TIMEOUT_PAGE);
      enduranceManager.addCheckpoint("Web page has been loaded");
    });
    // Close all tabs
    tabBrowser.closeAllTabs();
  });
}
