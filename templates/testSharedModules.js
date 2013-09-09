/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
const RELATIVE_ROOT   = '../lib';
const MODULE_REQUIRES = ['UtilsAPI'];

// Setup for the test
var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

// Run the shared module test
var testSampleTestcase = function() {

}
