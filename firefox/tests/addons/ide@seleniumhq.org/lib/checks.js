/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/**
 * @fileoverview Helper module containing assertions for Selenium IDE
 */

// Include the required modules
var {assert, expect} = require("../../../../../lib/assertions");

/**
 * Checks that the command passed.
 *
 * @param {SeleniumManager} seleniumManager Selenium manager instance
 */
function commandPassed(seleniumManager) {
 // Bug 621214
 // Find a way to check properties of treeView rows

 //check suite progress indicator
 var isSuiteProgressIndicatorGreen = seleniumManager.isSuiteProgressIndicatorGreen;
 expect.ok(isSuiteProgressIndicatorGreen, "Suite progress indicator is green");

 //check suite counts
 expect.equal(seleniumManager.runCount.getNode().value, "1", "1 test has run");
 expect.equal(seleniumManager.failureCount.getNode().value, "0", "No tests have failed");

 //check no errors in log
 var logErrors = seleniumManager.logErrors;
 assert.equal(logErrors.length, 0, "No error messages present");
}

/**
 * Checks that the command passed.
 *
 * @param {SeleniumManager} seleniumManager Selenium manager instance
 * @param {String} message Expected error message
 */
function commandFailed(seleniumManager, message) {
  // Bug 621214
  // Find a way to check properties of treeView rows

  //check suite progress indicator
  var isSuiteProgressIndicatorRed = seleniumManager.isSuiteProgressIndicatorRed;
  expect.ok(isSuiteProgressIndicatorRed, "Suite progress indicator is red");

  //check suite counts
  expect.equal(seleniumManager.runCount.getNode().value, "1", "1 test has run");
  expect.equal(seleniumManager.failureCount.getNode().value, "1", "1 test has failed");

  //check error in log
  message = "[error] " + message + "\n";
  var logErrors = seleniumManager.logErrors;
  assert.equal(logErrors.length, 1, "One error message present");

  assert.equal(logErrors[0].getNode().textContent, message,
               "Correct error message is present");
}

// Export of functions
exports.commandPassed = commandPassed;
exports.commandFailed = commandFailed;
