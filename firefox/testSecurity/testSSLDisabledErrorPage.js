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
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Anthony Hughes <ashughes@mozilla.com>
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
 * Litmus test #7774: Disable SSL
 */

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrefsAPI'];

const gDelay = 0;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var teardownModule = function(module) {
  try {
    // Reset the SSL and TLS prefs
    PrefsAPI.preferences.branch.clearUserPref("security.enable_ssl3");
    PrefsAPI.preferences.branch.clearUserPref("security.enable_tls");
  } catch(e) {
  }
}

/**
 * Test that SSL and TLS are checked by default
 *
 * @throws Expected error title 'Secure Connection Failed'!
 * @throws Expected error code ssl_error_ssl_disabled!
 * @throws Expected domain www.verisign.com!
 * @throws Expected SSL Disabled error message!
 */
var testDisableSSL = function() {
  // Open a blank page so we don't have any error page shown
  controller.open("about:blank");
  controller.waitForPageLoad(1000);

  PrefsAPI.handlePreferencesDialog(prefDialogCallback);

  controller.open("https://www.verisign.com");

  // Verify "Secure Connection Failed" error page title
  var title = new elementslib.ID(controller.tabs.activeTab, "errorTitleText");
  controller.waitForElement(title);
  if (title.getNode().textContent != "Secure Connection Failed") {
      throw "Expected error title 'Secure Connection Failed'!";
  }

  // Verify "Try Again" button appears
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "errorTryAgain"));

  // Verify the error message is correct
  var text = new elementslib.ID(controller.tabs.activeTab, "errorShortDescText");
  controller.waitForElement(text);
  if (text.getNode().textContent.indexOf("ssl_error_ssl_disabled") == -1) {
    throw "Expected error code ssl_error_ssl_disabled!";
  }

  if (text.getNode().textContent.indexOf("www.verisign.com") == -1) {
    throw "Expected domain www.verisign.com!";
  }

  if (text.getNode().textContent.indexOf("SSL protocol has been disabled") == -1) {
    throw "Expected SSL Disabled error message!";
  }
}

/**
 * Call-back handler for preferences dialog
 */
var prefDialogCallback = function(controller) {
  // Get the Advanced Pane
  var pane = '/id("BrowserPreferences")/anon({"orient":"vertical"})/anon({"anonid":"selector"})/{"pane":"paneAdvanced"}';
  controller.waitThenClick(new elementslib.Lookup(controller.window.document, pane));
  controller.sleep(gDelay);

  // Get the Encryption tab
  controller.waitThenClick(new elementslib.ID(controller.window.document, "encryptionTab"));
  controller.sleep(gDelay);

  // Make sure the Use SSL pref is not checked
  var sslPref = new elementslib.ID(controller.window.document, "useSSL3");
  controller.waitForElement(sslPref);
  if (sslPref.getNode().checked) {
    controller.click(sslPref);
  }

  // Make sure the Use TLS pref is not checked
  var tlsPref = new elementslib.ID(controller.window.document, "useTLS1");
  controller.waitForElement(tlsPref);
  if (tlsPref.getNode().checked) {
    controller.click(tlsPref);
  }

  // Close the Preferences dialog
  if (mozmill.isWindows) {
    var okButton = new elementslib.Lookup(controller.window.document, '/id("BrowserPreferences")/anon({"anonid":"dlg-buttons"})/{"dlgtype":"accept"}')
    controller.click(okButton);
  } else {
    controller.keypress(null, 'VK_ESCAPE', {});
  }
}
