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
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
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
 * ***** END LICENSE BLOCK ***** */

/**
 * Litmus test #8014: Options (Preferences) dialog state retention
 * Litmus test #8015: Open and dismiss the Options (Preferences) dialog
 */

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrefsAPI', 'UtilsAPI'];

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testOptionsDialogRetention = function() {
  // Reset pane to the main pane before starting the test
  PrefsAPI.handlePreferencesDialog(prefPaneResetCallback);

  // Choose the Privacy pane
  PrefsAPI.handlePreferencesDialog(prefPaneSetCallback);

  // And check if the Privacy pane is still selected
  PrefsAPI.handlePreferencesDialog(prefPaneCheckCallback);
}

var prefPaneResetCallback = function(controller) {
  // Select the Main pane
  var paneMain = '/id("BrowserPreferences")/anon({"orient":"vertical"})/anon({"anonid":"selector"})/{"pane":"paneMain"}';
  controller.waitThenClick(new elementslib.Lookup(controller.window.document, paneMain), gTimeout);

  // Check if the Main pane is active
  var privElem = new elementslib.ID(controller.window.document, "browserStartupPage");
  controller.waitForElement(privElem, gTimeout);

  // Close the Preferences dialog
  controller.keypress(null, 'VK_ESCAPE', {});
}

var prefPaneSetCallback = function(controller) {
  // Select the Advanced pane
  var firstPane = '/id("BrowserPreferences")/anon({"orient":"vertical"})/anon({"anonid":"selector"})/{"pane":"paneAdvanced"}';
  controller.waitThenClick(new elementslib.Lookup(controller.window.document, firstPane), gTimeout);
  controller.sleep(gDelay);

  // Check if the Advanced pane is active
  var advElem = new elementslib.ID(controller.window.document, "checkDefaultButton");
  controller.waitForElement(advElem, gTimeout);

  // Select the Privacy pane
  var paneCheck = '/id("BrowserPreferences")/anon({"orient":"vertical"})/anon({"anonid":"selector"})/{"pane":"panePrivacy"}';
  controller.click(new elementslib.Lookup(controller.window.document, paneCheck));

  // Check if the Privacy pane is active
  var privElem = new elementslib.ID(controller.window.document, "historyMode");
  controller.waitForElement(privElem, gTimeout);

  // Close the Preferences dialog
  controller.keypress(null, 'VK_ESCAPE', {});
}

var prefPaneCheckCallback = function(controller) {
  // Check if the Privacy pane is retained
  var privElem = new elementslib.ID(controller.window.document, "historyMode");
  controller.waitForElement(privElem, gTimeout);
  controller.sleep(gDelay);

  // Close the Preferences dialog
  controller.keypress(null, 'VK_ESCAPE', {});
}
