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

/**
 * Verify that we're in 32 bit mode
 */
function testArchitecture32bit() {
  expect.equal(Services.appinfo.XPCOMABI, "x86-gcc3",
               "After a restart the application still launches in 32bit mode");
}

/**
 * Restart in 64 bit mode
 */
function teardownModule(aModule) {
  aModule.controller.restartApplication(null, Ci.nsIAppStartup.eRestartx86_64);
}

if (persisted.skipTests) {
  setupModule.__force_skip__ = "Architecture changes only supported on OSX 10.6 or newer";
  teardownModule.__force_skip__ = "Architecture changes only supported on OSX 10.6 or newer";
}
