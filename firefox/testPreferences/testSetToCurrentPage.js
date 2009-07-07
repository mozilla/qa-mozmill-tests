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
 * The Original Code is Mozilla Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is Mozilla Corporation.
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
 * Litmus test #5921: Set Home Page to current page
 * Litmus test #5989: Home button
 */

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrefsAPI', 'UtilsAPI'];

const gDelay = 0;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var teardownModule = function(module) {
  try {
    PrefsAPI.preferences.branch.clearUserPref("browser.startup.homepage");
  } catch(e) {}
}

var testSetHomePage = function() {
  var homepage = 'http://www.mozilla.org/';

  // Close all tabs and open a blank page
  UtilsAPI.closeAllTabs(controller);

  // Go to the Mozilla.org website and verify the correct page has loaded
  controller.open(homepage);
  controller.waitForPageLoad(controller.tabs.activeTab);
  controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Mozilla"));

  // Call Prefs Dialog and set Home Page
  PrefsAPI.handlePreferencesDialog(prefDialogHomePageCallback);

  // Open another page before going to the home page
  controller.open('http://www.yahoo.com/');
  controller.waitForPageLoad(controller.tabs.activeTab);

  // Go to the saved home page and verify it's the correct page
  controller.click(new elementslib.ID(controller.window.document, "home-button"));
  controller.waitForPageLoad(controller.tabs.activeTab);

  // Verify location bar with the saved home page
  var locationBar = new elementslib.ID(controller.window.document, "urlbar");
  controller.assertValue(locationBar, homepage);
}

var prefDialogHomePageCallback = function(controller) {
  // Select the Main pane
  controller.click(new elementslib.Lookup(controller.window.document, '/id("BrowserPreferences")/anon({"orient":"vertical"})/anon({"anonid":"selector"})/{"pane":"paneMain"}'));

  // Check if the Main pane is active
  var node = new elementslib.ID(controller.window.document, 'paneMain');
  UtilsAPI.delayedAssertNode(controller, node);
  controller.sleep(gDelay);

  // Set Home Page to the current page
  controller.click(new elementslib.ID(controller.window.document, "useCurrent"));

  // Close the Preferences dialog
  if (mozmill.isWindows) {
    var okButton = new elementslib.Lookup(controller.window.document, '/id("BrowserPreferences")/anon({"anonid":"dlg-buttons"})/{"dlgtype":"accept"}')
    controller.click(okButton);
  } else {
    controller.keypress(null, 'VK_ESCAPE', {});
  }
}
