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
 * Litmus test #5970: Main Menu of Options (Preferences)
 */

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrefsAPI', 'UtilsAPI'];

var gDelay = 0;
var gTimeout = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

var testPreferencesPanes = function() {
  PrefsAPI.handlePreferencesDialog(prefDialogCallback);
}

/**
 * Call-back handler for preferences dialog
 */
var prefDialogCallback = function(controller) {
  // List of all available panes inside the Preferences window
  var panes = [
               {button: '{"pane":"paneMain"}', panel: 'paneMain'},
               {button: '{"pane":"paneTabs"}', panel: 'paneTabs'},
               {button: '{"pane":"paneContent"}', panel: 'paneContent'},
               {button: '{"pane":"paneApplications"}', panel: 'paneApplications'},
               {button: '{"pane":"panePrivacy"}', panel: 'panePrivacy'},
               {button: '{"pane":"paneSecurity"}', panel: 'paneSecurity'},
               {button: '{"pane":"paneAdvanced"}', panel: 'paneAdvanced'}
              ];

  // Step through each of the panes
  for each (pane in panes) {
    var button = '/id("BrowserPreferences")/anon({"orient":"vertical"})/anon({"anonid":"selector"})/' + pane.button;
    controller.click(new elementslib.Lookup(controller.window.document, button));
    controller.sleep(gDelay);

    // Check if the panel has been shown
    var node = new elementslib.ID(controller.window.document, pane.panel);
    controller.waitForElement(node, gTimeout);
  }

  // Close the Preferences window
  controller.keypress(null, 'VK_ESCAPE', {});
}
