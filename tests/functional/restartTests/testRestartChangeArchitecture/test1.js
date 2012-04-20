/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Dave Townsend <dtownsend@oxymoronical.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

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
