/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

const TEST_DATA = "ftp://ftp.mozilla.org/pub/";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  var version = Services.sysinfo.getProperty("version");
  var architecture = Services.sysinfo.getProperty("arch");
  if (mozmill.isLinux && version.indexOf("3.2.0") !== -1 &&
      architecture == "x86") {
    testNavigateFTP.__force_skip__ = "Bug 898194 - Disabled test due to crash " +
                                     "on Ubuntu 12.04 2bit";
  }
}

var testNavigateFTP = function () {
  // opens the mozilla.org ftp page then navigates through a couple levels.
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var firefox = new elementslib.Link(controller.tabs.activeTab, 'firefox');
  controller.waitThenClick(firefox);
  controller.waitForPageLoad();

  var nightly = new elementslib.Link(controller.tabs.activeTab, 'nightly');
  controller.waitThenClick(nightly);
  controller.waitForPageLoad();

  var latestLink = new elementslib.Link(controller.tabs.activeTab, 'latest-trunk');
  controller.waitForElement(latestLink);
}

/**
 * Map test functions to litmus tests
 */
// testNavigateFTP.meta = {litmusids : [7962]};
