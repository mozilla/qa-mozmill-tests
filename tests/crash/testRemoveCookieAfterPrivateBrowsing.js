/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var modalDialog = require("../../lib/modal-dialog");
var privateBrowsing = require("../../lib/private-browsing");

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();
}

/**
* Test that we do not crash when removing a cookie
*/
var testCrashRemoveCookieAfterPrivateBrowsingMode = function()
{
  var pb = new privateBrowsing.privateBrowsing(controller);

  pb.enabled = false;
  pb.showPrompt = false;

  pb.start();
  pb.stop();

  pb.showPrompt = true;
  pb.enabled = false;

  // Call clear recent history dialog and clear all form history
  var md = new modalDialog.modalDialog(controller.window);
  md.start(clearHistoryHandler);

  controller.mainMenu.click("#sanitizeItem");
  md.waitForDialog();
}

/**
 * Accesses the clear recent history dialog and accepts the default options to clear
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var clearHistoryHandler = function(controller)
{
  var clearButton = new elementslib.Lookup(controller.window.document, '/id("SanitizeDialog")/anon({"anonid":"dlg-buttons"})/{"dlgtype":"accept"}');
  controller.waitThenClick(clearButton);
}
