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
 *   Anthony Hughes <ahughes@mozilla.com>
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
 * Litmus test #6327: Pop-ups Allowed
 */

var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrefsAPI', 'UtilsAPI'];

const gDelay = 0;

var url = "https://litmus.mozilla.org/testcase_files/firefox/5918/index.html";

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

var teardownModule = function(module) {
  try {
    // Reset the pop-up blocking pref
    PrefsAPI.preferences.branch.clearUserPref("dom.disable_open_during_load");
  } catch(e) {
  }

  for each (window in mozmill.utils.getWindows()) {
    if (window.content && window.content.location == "http://www.mozilla.org/") {
      window.close();
    }
  }

  UtilsAPI.closeAllTabs(controller);
}

/**
 * Test to make sure pop-ups are not blocked
 *
 * @throws Pop-ups were blocked
 * @throws Status bar icon is visible
 */
var testPopUpAllowed = function() {
  UtilsAPI.closeAllTabs(controller);

  PrefsAPI.handlePreferencesDialog(prefDialogCallback);

  // Get the Window count
  var windowCount = mozmill.utils.getWindows().length;

  // Open the Pop-up test site
  controller.open(url);
  controller.waitForPageLoad(controller.tabs.activeTab);

  // A notification bar always exists in the DOM so check the visibility of the X button
  var xButton = UtilsAPI.createNotificationBarElement(controller, '/{"value":"popup-blocked"}/anon({"type":"warning"})/{"class":"messageCloseButton tabbable"}');
  controller.assertNodeNotExist(xButton);

  // Check for the status bar icon
  var cssInfo = controller.window.getComputedStyle(controller.window.document.getElementById("page-report-button"), "");
  if (cssInfo.getPropertyValue('display') != "none") {
    throw "Status bar icon is visible";
  }

  // Check that the window count has not changed
  if (windowCount == mozmill.utils.getWindows().length) {
    throw "Pop-ups were blocked";
  }
}

/**
 * Call-back handler for preferences dialog
 */
var prefDialogCallback = function(controller) {
  // Get the Content Pane
  var pane = '/id("BrowserPreferences")/anon({"orient":"vertical"})/anon({"anonid":"selector"})/{"pane":"paneContent"}';
  controller.click(new elementslib.Lookup(controller.window.document, pane));
  controller.sleep(gDelay);

  // Make sure the pref is unchecked
  var pref = new elementslib.ID(controller.window.document, "popupPolicy");
  controller.waitForElement(pref, null, null);
  var checked = pref.getNode().checked;
  if (checked) {
    controller.click(pref);
    controller.sleep(gDelay);
  }

  // Close the preferences dialog
  if (mozmill.isWindows) {
    var okButton = new elementslib.Lookup(controller.window.document, '/id("BrowserPreferences")/anon({"anonid":"dlg-buttons"})/{"dlgtype":"accept"}');
    controller.click(okButton);
  } else {
    controller.keypress(null, 'VK_ESCAPE', {});
  }
}
