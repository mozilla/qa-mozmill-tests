/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var { expect } = require("../../../../lib/assertions");

// File names for crash reporter application on all platforms
const FILE_NAMES = {
                    "darwin" : "crashreporter.app",
                    "win32"  : "crashreporter.exe",
                    "linux"  : "crashreporter"
                   };

// Expected states of the crash reporter
const STATES = {
                "Enabled" : true,
                "ServerURLPattern" : /^https:\/\/crash-reports\.mozilla\.com\/submit.*/
               };

var setupModule = function (aModule) {
  aModule.controller = mozmill.getBrowserController();

  // Get the crash reporter service
  aModule.crashReporter = Cc["@mozilla.org/toolkit/crash-reporter;1"]
                          .getService(Ci.nsICrashReporter);
}

/**
 * Test that Breakpad is installed
 */
var testBreakpadInstalled = function () {
  // Check that the crash reporter executable is present
  let execFile = Services.dirsvc.get("XREExeF", Ci.nsIFile);
  execFile.leafName = FILE_NAMES[mozmill.platform];

  expect.ok(execFile.exists(), "The crash reporter executable is present");

  expect.equal(crashReporter.enabled, STATES["Enabled"],
               "The crash reporter is enabled");

  expect.match(crashReporter.serverURL.spec, STATES["ServerURLPattern"],
               "The Breakpad server URL is correct");
}
