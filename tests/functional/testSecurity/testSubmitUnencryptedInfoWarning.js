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
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
 *   Remus Pop <remus.pop@softvision.ro>
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

// Include necessary modules
var {expect} = require("../../../lib/assertions");
var modalDialog = require("../../../lib/modal-dialog");
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const gDelay = 0;
const gTimeout = 5000;

const TIMEOUT_MODAL_DIALOG = 30000;
const TEST_SITE = "https://www.mozilla.org/";

var gPreferences = new Array("security.warn_entering_secure",
                             "security.warn_entering_weak",
                             "security.warn_leaving_secure",
                             "security.warn_submit_insecure",
                             "security.warn_viewing_mixed");

function setupModule(module) {
  controller = mozmill.getBrowserController();
  tabs.closeAllTabs(controller);
}

function teardownModule(module)
{
  for each (p in gPreferences)
    prefs.preferences.clearUserPref(p);
}

/**
 * Test warning about submitting unencrypted information
 */
function testSubmitUnencryptedInfoWarning() {
  // Enable the 'warn_submit_insecure' pref only
  for (var i = 0; i < gPreferences.length; i++)
    prefs.preferences.setPref(gPreferences[i], (i == 3));

  // Load an unencrypted page
  controller.open(TEST_SITE);
  controller.waitForPageLoad();

  // Get the web page's search box
  var searchbox = new elementslib.ID(controller.tabs.activeTab, "q");
  controller.waitForElement(searchbox, gTimeout);

  // Use the web page search box to submit information
  var goButton = new elementslib.ID(controller.tabs.activeTab,
                                    "quick-search-btn");
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
  var searchResultsField = new elementslib.Selector(controller.tabs.activeTab,
                                                    'input.gsc-input');
  expect.equal(searchResultsField.getNode().value, "mozilla",
               "The value in the search field is the expected search term");
}

/**
 * Helper function to handle interaction with the Security Warning modal dialog
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function handleSecurityWarningDialog(controller) {
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

// XXX: Bug 725486 - Failure in testSecurity/testSubmitUnencryptedInfoWarning.js | 
// The value in the search field should equal 'mozilla'
setupModule.__force_skip__ = "Bug 725486 - Failure in testSecurity/testSubmitUnencryptedInfoWarning.js" + 
                             " | The value in the search field should equal 'mozilla'";
teardownModule.__force_skip__ = "Bug 725486 - Failure in testSecurity/testSubmitUnencryptedInfoWarning.js" + 
                                " | The value in the search field should equal 'mozilla'";

