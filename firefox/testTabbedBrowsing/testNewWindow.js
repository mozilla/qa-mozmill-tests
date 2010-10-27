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
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Tracy Walker <twalker@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Geo Mealer <gmealer@mozilla.com>
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

// Include required modules
var utils = require("../../shared-modules/testUtilsAPI");

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  controller2 = null;
}

var teardownModule = function(module) {
  if (controller2 && controller2.window)
    controller2.window.close();
}

/**
 * Test the opening of a new window
 */
var testNewWindow = function () {
  // Ensure current window does not have the home page loaded
  controller.open('about:blank');
  controller.waitForPageLoad();

  // Open a new window
  var windowCount = mozmill.utils.getWindows().length;

  controller.click(new elementslib.Elem(controller.menus['file-menu'].menu_newNavigator));
  controller.waitForEval("subject.utils.getWindows().length == subject.expectedCount",
                         gTimeout, 100,
                         {utils: mozmill.utils, expectedCount: windowCount + 1});

  // Bug 555347: We have to wait no not accidentally grab the wrong browser window
  controller.sleep(0);

  controller2 = utils.handleWindow("type", "navigator:browser",
                                   checkDefaultHomepage, true);
}

/**
 * Check if the default homepage has been opened
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function checkDefaultHomepage(controller) {
  var defaultHomepage = utils.getDefaultHomepage();

  controller.waitForPageLoad();
  utils.assertLoadedUrlEqual(controller, defaultHomepage);
}

/**
 * Map test functions to litmus tests
 */
// testNewWindow.meta = {litmusids : [7954]};
