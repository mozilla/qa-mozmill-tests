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
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Anthony Hughes <ahughes@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
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

// Include required modules
var modalDialog = require("../../shared-modules/modal-dialog");
var prefs = require("../../shared-modules/prefs");
var tabs = require("../../shared-modules/tabs");
var utils = require("../../shared-modules/utils");

const gDelay = 0;
const gTimeout = 5000;

const TIMEOUT_MODAL_DIALOG = 30000;
const TEST_SITE = "https://mail.mozilla.org";

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();
}

var teardownModule = function(module)
{
  // Reset the warning prefs
  var gPrefs = new Array("security.warn_entering_secure",
                         "security.warn_entering_weak",
                         "security.warn_leaving_secure",
                         "security.warn_submit_insecure",
                         "security.warn_viewing_mixed");
  for each (p in gPrefs)
    prefs.preferences.clearUserPref(p);
}

/**
 * Test warning about submitting unencrypted information
 */
var testSubmitUnencryptedInfoWarning = function()
{
  // Close the page because the warnings don't appear if you are on the page
  // where the warning was triggered
  tabs.closeAllTabs(controller);

  // Make sure the prefs are set
  prefs.openPreferencesDialog(controller, prefDialogCallback);

  // Load an unencrypted page
  controller.open(TEST_SITE);
  controller.waitForPageLoad();

  // Get the web page's search box
  var searchbox = new elementslib.ID(controller.tabs.activeTab, "q");
  controller.waitForElement(searchbox, gTimeout);

  // Use the web page search box to submit information
  var goButton = new elementslib.ID(controller.tabs.activeTab, "submit");
  controller.waitForElement(goButton, gTimeout);

  // Create a listener for the warning dialog
  var md = new modalDialog.modalDialog(controller.window);
  md.start(handleSecurityWarningDialog);

  controller.type(searchbox, "mozilla");
  controller.click(goButton);

  // A warning dialog should appear to caution the submit
  md.waitForDialog(TIMEOUT_MODAL_DIALOG);

  // Wait for the search results page to appear
  controller.waitForPageLoad();

  // Check that the search results page loaded
  var searchResultsField = new elementslib.Name(controller.tabs.activeTab, "q");
  controller.waitForElement(searchResultsField);
  controller.assertValue(searchResultsField, "mozilla");
}

/**
 * Call-back handler for preferences dialog
 *
 * @param {MozmMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(controller)
{
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneSecurity';

  // Click the Warning Messages Settings button
  var warningSettingsButton = new elementslib.ID(controller.window.document,
                                                 "warningSettings");
  controller.waitForElement(warningSettingsButton, gTimeout);

  // Create a listener for the Warning Messages Settings dialog
  var md = new modalDialog.modalDialog(controller.window);
  md.start(handleSecurityWarningSettingsDialog);

  // Click the Warning Messages Settings button
  controller.click(warningSettingsButton);
  md.waitForDialog();

  // Close the preferences dialog
  prefDialog.close(true);
}

/**
 * Helper function to handle interaction with the
 * Security Warning Settings modal dialog
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var handleSecurityWarningSettingsDialog = function(controller)
{
  // All the prefs in the dialog
  var gPrefs = new Array("warn_entering_secure",
                         "warn_entering_weak",
                         "warn_leaving_secure",
                         "warn_submit_insecure",
                         "warn_viewing_mixed");

  // Make sure only the "encrypted page" pref is checked
  for each (p in gPrefs) {
    var element = new elementslib.ID(controller.window.document, p);
    controller.waitForElement(element, gTimeout);
    controller.check(element, (p == "warn_submit_insecure"));
  }

  // Click OK on the Security window
  var okButton = new elementslib.Lookup(controller.window.document,
                                        '/id("SecurityWarnings")' +
                                        '/anon({"anonid":"dlg-buttons"})' +
                                        '/{"dlgtype":"accept"}');
  controller.click(okButton);
}

/**
 * Helper function to handle interaction with the Security Warning modal dialog
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var handleSecurityWarningDialog = function(controller)
{
  // Get the message text
  var message = utils.getProperty("chrome://pipnss/locale/security.properties",
                                  "PostToInsecureFromSecureMessage");

  // Wait for the content to load
  var infoBody = new elementslib.ID(controller.window.document, "info.body");
  controller.waitForElement(infoBody, gTimeout);

  // The message string contains "##" instead of \n for newlines.
  // There are two instances in the string. Replace them both.
  message = message.replace(/##/g, "\n\n");

  // Verify the message text
  controller.assertJSProperty(infoBody, "textContent", message);

  // Click the OK button
  var okButton = new elementslib.Lookup(controller.window.document,
                                        '/id("commonDialog")' +
                                        '/anon({"anonid":"buttons"})' +
                                        '/{"dlgtype":"accept"}');
  controller.click(okButton);
}

/**
 * Map test functions to litmus tests
 */
// testSubmitUnencryptedInfoWarning.meta = {litmusids : [7678]};
