/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview Helper module containing assertions for Selenium IDE
 */

/**
 * Checks that the command passed.
 * 
 * @param {SeleniumManager} seleniumManager Selenium manager instance 
 */
function commandPassed(seleniumManager) {
 // XXX: Bug 621214 - Find a way to check properties of treeView rows

 //check suite progress indicator
 var isSuiteProgressIndicatorGreen = seleniumManager.isSuiteProgressIndicatorGreen;
 seleniumManager.controller.assert(function () {
   return isSuiteProgressIndicatorGreen;
 }, "Suite progress indicator is green");

 //check suite counts
 seleniumManager.controller.assertValue(seleniumManager.runCount, "1");
 seleniumManager.controller.assertValue(seleniumManager.failureCount, "0");

 //check no errors in log
 var logErrors = seleniumManager.logErrors;
 seleniumManager.controller.assert(function () {
   return logErrors.length === 0;
 }, "No error messages present - got '" + logErrors.length +"', expected '" + 0 + "'");
}

/**
 * Checks that the command passed.
 * 
 * @param {SeleniumManager} seleniumManager Selenium manager instance 
 * @param {String} message Expected error message
 */
function commandFailed(seleniumManager, message) {
  // XXX: Bug 621214 - Find a way to check properties of treeView rows

  //check suite progress indicator
  var isSuiteProgressIndicatorRed = seleniumManager.isSuiteProgressIndicatorRed;
  seleniumManager.controller.assert(function () {
    return isSuiteProgressIndicatorRed;
  }, "Suite progress indicator is red");

  //check suite counts
  seleniumManager.controller.assertValue(seleniumManager.runCount, "1");
  seleniumManager.controller.assertValue(seleniumManager.failureCount, "1");

  //check error in log
  message = "[error] " + message + "\n";
  var logErrors = seleniumManager.logErrors;
  seleniumManager.controller.assert(function () {
    return logErrors.length === 1;
  }, "One error message present - got '" + logErrors.length +"', expected '" + 1 + "'");

  seleniumManager.controller.assert(function () {
    return logErrors[0].getNode().textContent === message;
  }, "Correct error message is present - got '" + logErrors[0].getNode().textContent +"', expected '" + message + "'");
}

// Export of functions
exports.commandPassed = commandPassed;
exports.commandFailed = commandFailed;