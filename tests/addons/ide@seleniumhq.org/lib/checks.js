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
 * The Original Code is Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 *
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Dave Hunt <dhunt@mozilla.com>
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