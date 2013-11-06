/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var {expect} = require("../../../../../lib/assertions");

if (mozmill.isMac) {
  var macutils = Cc["@mozilla.org/xpcom/mac-utils;1"].
                 getService(Ci.nsIMacUtils);

  // If already running in 32-bit mode then the machine doesn't support 64-bit
  // and if the build is not universal then we can't change architecture so
  // we should skip the tests
  persisted.skipTests = (Services.appinfo.XPCOMABI === "x86-gcc3") ||
                        !macutils.isUniversalBinary;
}
else {
  // Changing architecture isn't supported on OSs other than OSX
  persisted.skipTests = true;
}

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

/**
 * Verify that we're in 64 bit mode
 */
function testArchitecture64bit() {
  expect.equal(Services.appinfo.XPCOMABI, "x86_64-gcc3",
               "By default the application launches in 64bit mode");
}

/**
 * Restart normally
 */
function teardownModule(aModule) {
  // Bug 886811
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // startUserShutdown is broken in mozmill-2.0
  if ("restartApplication" in aModule.controller) {
    aModule.controller.restartApplication();
  }
  else {
    aModule.controller.startUserShutdown(4000, true);
    Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);
  }
}

if (persisted.skipTests) {
  setupModule.__force_skip__ = "Architecture changes only supported on OSX 10.6 or newer";
  teardownModule.__force_skip__ = "Architecture changes only supported on OSX 10.6 or newer";
}
