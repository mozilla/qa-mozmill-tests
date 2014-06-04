/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var {expect} = require("../../../../../lib/assertions");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

function teardownModule(aModule) {
  aModule.controller.stopApplication(true);
}

/**
 * Verify that we're in 64 bit mode
 */
function testRestarted64bit() {
  expect.equal(Services.appinfo.XPCOMABI, "x86_64-gcc3",
               "Successfully restarted in 64bit mode after requesting it");
}

if (persisted.skipTests) {
  setupModule.__force_skip__ = "Architecture changes only supported on OSX 10.6 or newer";
  teardownModule.__force_skip__ = "Architecture changes only supported on OSX 10.6 or newer";
}
