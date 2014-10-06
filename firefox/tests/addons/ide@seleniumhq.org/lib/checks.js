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
 * @param {SeleniumManager} aSeleniumManager Selenium manager instance
 */
function commandPassed(aSeleniumManager) {
 // Bug 621214
 // Find a way to check properties of treeView rows

 //check suite progress indicator
 var isSuiteProgressIndicatorGreen = aSeleniumManager.isSuiteProgressIndicatorGreen;
 expect.ok(isSuiteProgressIndicatorGreen, "Suite progress indicator is green");

 //check suite counts
 expect.equal(aSeleniumManager.runCount.getNode().value, "1", "1 test has run");
 expect.equal(aSeleniumManager.failureCount.getNode().value, "0", "No tests have failed");

 //check no errors in log
 var logErrors = aSeleniumManager.logErrors;
 assert.equal(logErrors.length, 0, "No error messages present");
}

/**
 * Checks that the command passed.
 *
 * @param {SeleniumManager} aSeleniumManager Selenium manager instance
 * @param {String} aMessage Expected error message
 */
function commandFailed(aSeleniumManager, aMessage) {
  // Bug 621214
  // Find a way to check properties of treeView rows

  //check suite progress indicator
  var isSuiteProgressIndicatorRed = aSeleniumManager.isSuiteProgressIndicatorRed;
  expect.ok(isSuiteProgressIndicatorRed, "Suite progress indicator is red");

  //check suite counts
  expect.equal(aSeleniumManager.runCount.getNode().value, "1", "1 test has run");
  expect.equal(aSeleniumManager.failureCount.getNode().value, "1", "1 test has failed");

  //check error in log
  aMessage = "[error] " + aMessage + "\n";
  var logErrors = aSeleniumManager.logErrors;
  assert.equal(logErrors.length, 1, "One error message present");

  assert.equal(logErrors[0].getNode().textContent, aMessage,
               "Correct error message is present");
}

// Export of functions
exports.commandPassed = commandPassed;
exports.commandFailed = commandFailed;
