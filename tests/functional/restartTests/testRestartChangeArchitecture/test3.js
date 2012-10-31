/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {expect} = require("../../../../lib/assertions");

function setupModule(module) {
  controller = mozmill.getBrowserController();
}

/**
 * Verify that we're in 32 bit mode
 */
function testRestarted32bit() {
  var runtime = Cc["@mozilla.org/xre/runtime;1"].
                getService(Ci.nsIXULRuntime);
  expect.equal(runtime.XPCOMABI, "x86-gcc3",
               "Successfully restarted in 32bit mode after requesting it");
}

/**
 * Restart normally
 */
function teardownTest() {
  controller.startUserShutdown(4000, true);
  var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].
                   getService(Ci.nsIAppStartup);
  appStartup.quit(Ci.nsIAppStartup.eAttemptQuit |  Ci.nsIAppStartup.eRestart);
}


if (persisted.skipTests)
  setupModule.__force_skip__ = "Architecture changes only supported on OSX 10.6";
