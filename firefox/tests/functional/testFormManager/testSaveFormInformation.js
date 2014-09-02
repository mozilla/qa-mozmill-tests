/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert, expect } = require("../../../../lib/assertions");
var modalDialog = require("../../../../lib/modal-dialog");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "form_manager/form.html";

const FNAME = "John";
const LNAME = "Smith";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  // Clear complete form history so we don't interfere with already added entries
  try {
    var formHistory = Cc["@mozilla.org/satchel/form-history;1"]
                      .getService(Ci.nsIFormHistory2);
    formHistory.removeAllEntries();
  }
  catch (ex) {}
}

/**
 * Verify saving and filling in form information
 */
function testSaveFormInformation() {
  // Go to the sample page and submit form data
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var firstName = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  var lastName = new elementslib.ID(controller.tabs.activeTab, "ship_lname");
  var submitButton = new elementslib.ID(controller.tabs.activeTab, "SubmitButton");

  controller.type(firstName, FNAME);
  controller.type(lastName, LNAME);

  controller.click(submitButton);
  controller.waitForPageLoad();

  firstName = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  controller.waitForElement(firstName);
  controller.type(firstName, FNAME.substring(0,2));

  // Verify form completion in each inputted field
  var popDownAutoCompList = new elementslib.ID(controller.window.document, "PopupAutoComplete");

  assert.waitFor(function() {
    return popDownAutoCompList.getNode().popupOpen;
  }, "Autocomplete popup is open: expected 'true'");

  controller.keypress(firstName, "VK_DOWN", {});
  controller.click(popDownAutoCompList);
  expect.equal(firstName.getNode().value, FNAME, "First name has been autocompleted");

  lastName = new elementslib.ID(controller.tabs.activeTab, "ship_lname");
  controller.type(lastName, LNAME.substring(0,2));

  assert.waitFor(function() {
  return popDownAutoCompList.getNode().popupOpen;
  }, "Autocomplete popup is open: expected 'true'");

  controller.keypress(lastName, "VK_DOWN", {});
  controller.click(popDownAutoCompList);
  expect.equal(lastName.getNode().value, LNAME, "Last name has been autocompleted");
}
