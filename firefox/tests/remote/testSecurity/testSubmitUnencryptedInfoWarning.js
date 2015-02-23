/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var {expect} = require("../../../../lib/assertions");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");

var dialogs = require("../../../../lib/ui/dialogs");

const TEST_DATA = "https://ssl-dv.mozqa.com/data/firefox/security/" +
                  "unencryptedsearch.html";

const TIMEOUT_MODAL_DIALOG = 30000;

var gPreferences = new Array("security.warn_entering_secure",
                             "security.warn_entering_weak",
                             "security.warn_leaving_secure",
                             "security.warn_submit_insecure",
                             "security.warn_viewing_mixed");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  tabs.closeAllTabs(aModule.controller);
}

function teardownModule(aModule) {
  for each (var p in gPreferences)
    prefs.clearUserPref(p);
}

/**
 * Test warning about submitting unencrypted information
 */
function testSubmitUnencryptedInfoWarning() {
  // Enable the 'warn_submit_insecure' pref only
  for (var i = 0; i < gPreferences.length; i++)
    prefs.setPref(gPreferences[i], (i == 3));

  // Load an unencrypted page
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the web page's search box
  var searchbox = new elementslib.ID(controller.tabs.activeTab, "q");
  controller.waitForElement(searchbox);

  // Use the web page search box to submit information
  var submitButton = new elementslib.ID(controller.tabs.activeTab,
                                        "submit");
  controller.waitForElement(submitButton);

  // Create a listener for the warning dialog
  var md = new modalDialog.modalDialog(controller.window);
  md.start(handleSecurityWarningDialog);

  controller.type(searchbox, "mozilla");
  controller.click(submitButton);

  // A warning dialog should appear to caution the submit
  md.waitForDialog(TIMEOUT_MODAL_DIALOG);

  // Wait for the search results page to appear
  controller.waitForPageLoad();

  // Check that the search results page loaded
  var searchTerm = new elementslib.ID(controller.tabs.activeTab,
                                      'search-term');
  expect.equal(searchTerm.getNode().textContent, "mozilla",
               "Search term correctly submitted");
}

/**
 * Helper function to handle interaction with the Security Warning modal dialog
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function handleSecurityWarningDialog(aController) {
  // Get the message text
  var message = utils.getProperty("chrome://global/locale/browser.properties",
                                  "formPostSecureToInsecureWarning.message");
  var dialog = new dialogs.CommonDialog(aController);

  // Wait for the content to load
  var infoBody = dialog.getElement({type: "info_body"});

  // The message string contains "##" instead of \n for newlines.
  // There are two instances in the string. Replace them both.
  message = message.replace(/##/g, "\n\n");

  expect.equal(infoBody.getNode().textContent, message,
               "The dialog shows the security message");
  dialog.accept();
}
