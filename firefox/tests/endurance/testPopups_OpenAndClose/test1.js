/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");

// Include the required modules
var endurance = require("../../../../lib/endurance");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var windows = require("../../../../lib/windows");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_URL = BASE_URL + "popups/popup_trigger.html?count=";

const PREF_DISABLE_POPUPS = "dom.disable_open_during_load";
const PREF_MAX_POPUPS = "dom.popup_maximum";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.enduranceManager = new endurance.EnduranceManager(aModule.controller);
  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  prefs.setPref(PREF_MAX_POPUPS, enduranceManager.entities);
  prefs.setPref(PREF_DISABLE_POPUPS, false);

  aModule.tabBrowser.closeAllTabs();
}

function teardownModule(aModule) {
  aModule.tabBrowser.closeAllTabs();
  windows.closeAllWindows(aModule.controller.window);

  prefs.clearUserPref(PREF_MAX_POPUPS);
  prefs.clearUserPref(PREF_DISABLE_POPUPS);
}

/**
 * Test opening and closing popups
 */
function testOpenAndClosePopups() {
  enduranceManager.run(() => {
    controller.open(TEST_URL + enduranceManager.entities);
    controller.waitForPageLoad();

    enduranceManager.addCheckpoint(enduranceManager.entities + " popup(s) opened");

    var windowsLength = mozmill.utils.getWindows("navigator:browser").length;
    assert.waitFor(() => windowsLength - 1 === enduranceManager.entities,
                   enduranceManager.entities + " popups have been opened");

    windows.closeAllWindows(controller.window);
    windowsLength = mozmill.utils.getWindows("navigator:browser").length;
    assert.equal(windowsLength - 1, 0, "All popups have been closed");

    enduranceManager.addCheckpoint(enduranceManager.entities + " popup(s) closed");
  });
}
