/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource://gre/modules/Services.jsm");

// Include required modules
var { expect } = require("../../../lib/assertions");

// File names for crash reporter application on all platforms
const fileNames = {
                   "darwin" : "crashreporter.app",
                   "win32"  : "crashreporter.exe",
                   "linux"  : "crashreporter"
                  };

// Expected states of the crash reporter
const states = {
                "Enabled" : true,
                "ServerURLPattern" : /^https:\/\/crash-reports\.mozilla\.com\/submit.*/
               };

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  // Get the crash reporter service
  module.crashReporter = Cc["@mozilla.org/toolkit/crash-reporter;1"]
                           .getService(Ci.nsICrashReporter);
}

/**
 * Test that Breakpad is installed
 */
var testBreakpadInstalled = function()
{
  // Check that the crash reporter executable is present
  var execFile = Cc["@mozilla.org/file/local;1"]
                    .createInstance(Ci.nsILocalFile);
  execFile.initWithPath(Services.dirsvc.get("XCurProcD", Ci.nsILocalFile).path);
  execFile.append(fileNames[mozmill.platform]);

  expect.ok(execFile.exists(), "The crash reporter executable is present");

  expect.equal(crashReporter.enabled, states["Enabled"],
               "The crash reporter is enabled");

  expect.match(crashReporter.serverURL.spec, states["ServerURLPattern"],
               "The Breakpad server URL is correct");
}

/**
 * Map test functions to litmus tests
 */
// testBreakpadInstalled.meta = {litmusids : [7953]};
