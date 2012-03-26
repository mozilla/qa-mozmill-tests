/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var prefs = require("../../../lib/prefs");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'form_manager/form.html';

const FNAME = "John";
const LNAME = "Smith";

var setupModule = function() {
  controller = mozmill.getBrowserController();

  // Clear complete form history so we don't interfer with already added entries
  var formHistory = Cc["@mozilla.org/satchel/form-history;1"].
                    getService(Ci.nsIFormHistory2);
  formHistory.removeAllEntries();
}

var teardownModule = function() {
  prefs.preferences.clearUserPref("browser.formfill.enable");
}

var testToggleFormManager = function() {
  // Open Preferences dialog and uncheck save form and search history in the privacy pane
  prefs.openPreferencesDialog(controller, prefDialogFormCallback);

  // Go to the sample form page and submit form data
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var firstName = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  var lastName = new elementslib.ID(controller.tabs.activeTab, "ship_lname");

  controller.type(firstName, FNAME);
  controller.type(lastName, LNAME);

  var submitButton = new elementslib.ID(controller.tabs.activeTab, "SubmitButton");
  controller.click(submitButton);
  controller.waitForPageLoad();

  firstName = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  controller.waitForElement(firstName, TIMEOUT);
  controller.type(firstName, FNAME.substring(0,2));
  controller.sleep(TIMEOUT);

  // Verify no form completion in each submitted form field
  var popDownAutoCompList = new elementslib.Lookup(
                              controller.tabs.activeTab, 
                              '/id("main-window")' + 
                              '/id("mainPopupSet")' + 
                              '/id("PopupAutoComplete")' + 
                              '/anon({"anonid":"tree"})' + 
                              '/{"class":"autocomplete-treebody"}'
  );

  controller.assertNodeNotExist(popDownAutoCompList);
  controller.assertValue(firstName, FNAME.substring(0,2));

  lastName = new elementslib.ID(controller.tabs.activeTab, "ship_lname");
  controller.type(lastName, LNAME.substring(0,2));
  controller.sleep(TIMEOUT);
  controller.assertNodeNotExist(popDownAutoCompList);
  controller.assertValue(lastName, LNAME.substring(0,2));
}

/**
 * Use preferences dialog to disable the form manager
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogFormCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'panePrivacy';

  // Select custom settings for history and uncheck remember search and form history
  var historyMode = new elementslib.ID(controller.window.document, "historyMode");
  controller.waitForElement(historyMode);
  controller.select(historyMode, null, null, "custom");

  var rememberForms = new elementslib.ID(controller.window.document, "rememberForms");
  controller.waitThenClick(rememberForms);

  prefDialog.close(true);
}

/**
 * Map test functions to litmus tests
 */
// testToggleFormManager.meta = {litmusids : [8050]};
