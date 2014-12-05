/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert, expect } = require("../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "form_manager/form.html";

const PREF_SAVE_FORM_SEARCH_HISTORY = "browser.formfill.enable"

const FNAME = "John";
const LNAME = "Smith";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  // Clear complete form history so we don't interfer with already added entries
  var formHistory = Cc["@mozilla.org/satchel/form-history;1"]
                    .getService(Ci.nsIFormHistory2);
  formHistory.removeAllEntries();

  // Do not save form and search history
  prefs.setPref(PREF_SAVE_FORM_SEARCH_HISTORY, false);
}

var teardownModule = function(aModule) {
  prefs.clearUserPref(PREF_SAVE_FORM_SEARCH_HISTORY);
}

var testToggleFormManager = function() {
  // Go to the sample form page and submit form data
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var firstName = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  var lastName = new elementslib.ID(controller.tabs.activeTab, "ship_lname");

  controller.type(firstName, FNAME);
  controller.type(lastName, LNAME);

  var submitButton = new elementslib.ID(controller.tabs.activeTab, "SubmitButton");
  controller.click(submitButton);
  controller.waitForPageLoad();

  firstName = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  controller.waitForElement(firstName);
  controller.type(firstName, FNAME.substring(0,2));

  // Verify no form completion in each submitted form field
  var popDownAutoCompList = new elementslib.Lookup(
                              controller.tabs.activeTab,
                              '/id("main-window")' +
                              '/id("mainPopupSet")' +
                              '/id("PopupAutoComplete")' +
                              '/anon({"anonid":"tree"})' +
                              '/{"class":"autocomplete-treebody"}'
  );

  assert.ok(!popDownAutoCompList.exists(),
            "Form completion element has not been found");
  expect.notEqual(firstName.getNode().value, FNAME,
                  "First name has not been autocompleted");

  lastName = new elementslib.ID(controller.tabs.activeTab, "ship_lname");
  controller.type(lastName, LNAME.substring(0,2));
  assert.ok(!popDownAutoCompList.exists(),
            "Form completion element has not been found");
  expect.notEqual(lastName.getNode().value, LNAME,
                  "Last name has not been autocompleted");
}

