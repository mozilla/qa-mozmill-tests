/* * ***** BEGIN LICENSE BLOCK *****
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
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <hskupin@mozilla.com>
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
 * **** END LICENSE BLOCK ***** */

/**
 *  Litmus test #9154: Enable Private Browsing Mode
 *  Litmus test #9155: Stop Private Browsing Mode
 *  Litmus test #9186: Verify Ctrl/Cmd+Shift+P keyboard shortcut for Private Browsing mode
 *  Litmus test #9203: Verify about:privatebrowsing in private browsing mode
 */

var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrivateBrowsingAPI', 'UtilsAPI'];

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  UtilsAPI.closeAllTabs(controller);

  // Create Private Browsing instance and set handler
  pb = new PrivateBrowsingAPI.privateBrowsing(controller);
  pb.handler = pbStartHandler;
}

var teardownModule = function(module) {
  // Reset Private Browsing options
  pb.showPrompt = true;
  pb.enabled = false;
}

/**
 * Test start and stop of Private Browsing mode
 */
var testEnterPrivateBrowsingMode = function() {
  // Make sure PB mode is not active and a prompt will be shown
  pb.enabled = false;
  pb.showPrompt = true;

  // Run twice to check with and without prompt
  for (var ii = 0; ii < 2; ii++) {
    // First iteration uses shortcut, the second one the menu entry
    pb.start(ii);
    controller.sleep(gDelay);

    if (!pb.enabled)
      throw "Private Browsing mode hasn't been started";

    // Only one tab with the about:privatebrowsing page should be visible
    if (controller.tabs.length != 1)
      throw "Expected one open tab with about:privatebrowsing page displayed";

    // Check for the more info link in the about:privatebrowsing page
    var link = new elementslib.ID(controller.tabs.activeTab, "moreInfoLink");
    controller.waitForElement(link);

    pb.stop(ii);
    controller.sleep(gDelay);

    if (pb.enabled)
      throw "Private Browsing mode hasn't been stopped";
  }
}

/**
 * Test that "(Private Browsing)" identifier is shown in the window title
 */
var testWindowTitle = function() {
  var doc = controller.window.document;
  var modifier = doc.documentElement.getAttribute("titlemodifier_privatebrowsing");

  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  pb.start();
  controller.sleep(gDelay);

  // Title modifier should have been set
  if (doc.title.indexOf(modifier) == -1)
    throw "Private Browsing identifier not found in window title";

  pb.stop();
  controller.sleep(gDelay);

  // Title modifier should have been removed
  if (doc.title.indexOf(modifier) != -1)
    throw "Private Browsing identifier is still visible in window title";
}

/**
 * Handler for modal dialog
 */
var pbStartHandler = function(controller) {
  // Check to not ask anymore for entering Private Browsing mode
  var checkbox = new elementslib.ID(controller.window.document, 'checkbox');
  controller.waitThenClick(checkbox, 5000);
  controller.sleep(gDelay);

  controller.click(new elementslib.Lookup(controller.window.document, '/id("commonDialog")/anon({"anonid":"buttons"})/{"dlgtype":"accept"}'));
}
