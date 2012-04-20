/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

if (mozmill.isMac) {
  var runtime = Cc["@mozilla.org/xre/runtime;1"].
                getService(Ci.nsIXULRuntime);
  var macutils = Cc["@mozilla.org/xpcom/mac-utils;1"].
                 getService(Ci.nsIMacUtils);

  // If already running in 32-bit mode then the machine doesn't support 64-bit
  // and if the build is not universal then we can't change architecture so
  // we should skip the tests
  persisted.skipTests = (runtime.XPCOMABI === "x86-gcc3") ||
                        !macutils.isUniversalBinary;
}
else {
  // Changing architecture isn't supported on OSs other than OSX
  persisted.skipTests = true;
}


function setupModule(module) {
  controller = mozmill.getBrowserController();
}

/**
 * Verify that we're in 64 bit mode
 */
function testArchitecture64bit() {
  controller.assert(function () {
    return runtime.XPCOMABI === "x86_64-gcc3";
  }, "ABI should be correct - got '" + runtime.XPCOMABI + "', expected 'x86_64-gcc3'");
}

/**
 * Restart normally
 */
function teardownModule() {
  controller.startUserShutdown(4000, true);
  var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].
                   getService(Ci.nsIAppStartup);
  appStartup.quit(Ci.nsIAppStartup.eAttemptQuit |  Ci.nsIAppStartup.eRestart);
}

//if (persisted.skipTests) {
//  setupModule.__force_skip__ = "Architecture changes only supported on OSX 10.5 and higher";
//  teardownModule.__force_skip__ = "Architecture changes only supported on OSX 10.5 and higher";
//}

setupModule.__force_skip__ = "Bug 747299 - startUserShutdown() broken by jsbridge port selection";
teardownModule.__force_skip__ = "Bug 747299 - startUserShutdown() broken by jsbridge port selection";
