/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var forms = require("../forms");

const BASE_URL = collector.addHttpResource("../../data/");
const TEST_DATA = BASE_URL + "form_manager/form.html";

const INPUT_TEXTS = ["John", "Ema", "Yoana", "John"];
const COUNT_DIFFERENT = 3;
const INPUT_ENTRY = "TestEntry";
const INPUT_ENTRY2 = "TestEntry2";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  forms.clear();
}

function teardownModule(aModule) {
  forms.clear();
}

function testFormData() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var inputField = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  var submitButton = new elementslib.ID(controller.tabs.activeTab, "SubmitButton");

  // Add a field to the input
  forms.add(inputField.getNode().id, INPUT_ENTRY);

  // Count all results for a field
  expect.equal(forms.count({fieldname: inputField.getNode().id}), 1,
               "Number of entries for field '" + inputField.getNode().id + " is correct");

  // Count all results in DB
  expect.equal(forms.count(), 1, "Number of all avaible entries is correct.");

  // Count all results that meets a criteria
  expect.equal(forms.count({fieldname: inputField.getNode().id, timesUsed: 1}), 1,
               "One entry for field '" + inputField.getNode().id + "' was found ");

  // Add some more fields
  INPUT_TEXTS.forEach(function (aInput) {
    inputField.sendKeys(aInput);
    submitButton.click();
    controller.waitForPageLoad();
  });

  var autoCompleteResults = forms.getResults({fieldname: inputField.getNode().id,
                                              searchString: INPUT_ENTRY});
  expect.equal(autoCompleteResults.length, 1,
               "One form entry found for field '" + inputField.getNode().id + "'");

  expect.equal(forms.getResults({fieldname: inputField.getNode().id}).length, 4,
               "Number of form entries found for field '" + inputField.getNode().id +
               "' is correct");

  var searchResults = forms.search({selectTerms: ["timesUsed", "guid"],
                                    value: INPUT_ENTRY});
  expect.equal(searchResults[0].timesUsed, 1,
               "'" + INPUT_ENTRY + "' entry was found and timesUsed was retrieved");

  // Get the guid of the entry
  var entryGuid = forms.search({selectTerms: ["guid"],
                                fieldname: inputField.getNode().id,
                                value: INPUT_ENTRY})[0].guid;

  forms.update({bump: true, guid: entryGuid});

  var searchItems = forms.search({selectTerms: ["timesUsed"],
                                  fieldname: inputField.getNode().id,
                                  value: INPUT_ENTRY});
  expect.equal(searchItems[0].timesUsed, 2,
               "'" + INPUT_ENTRY + "' entry was bumped to the correct number");

  forms.update({guid: entryGuid, timesUsed: 10, value: INPUT_ENTRY2});

  searchResults = forms.search({selectTerms: ["timesUsed"], value: INPUT_ENTRY2});
  expect.equal(searchResults.length, 1,
               "'" + INPUT_ENTRY2 + "' entry has been found");
  expect.equal(searchResults[0].timesUsed, 10,
               "'" + INPUT_ENTRY2 +
               "' entry's used times has been updated with the correct number");

  expect.equal(forms.search().length, 4, "All entries added have been found");

  forms.clear({fieldname: inputField.getNode().id, value: INPUT_ENTRY2});

  expect.equal(forms.count({fieldname: inputField.getNode().id}), 3,
               "Entry '" + INPUT_ENTRY2 + "' has been deleted");

  forms.clear({fieldname: inputField.getNode().id});
  expect.equal(forms.count({fieldname: inputField.getNode().id}), 0,
               "All entries have been deleted");
}
