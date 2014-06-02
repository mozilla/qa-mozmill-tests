/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { assert } = require("../../../../lib/assertions");
var forms = require("../../../../lib/forms");
var popups = require("../../../lib/popups");
var tabs = require("../../../lib/ui/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "form_manager/form.html";

// Sample string used in our tests
const INPUT_TEXT = "John";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.tabBrowser = new tabs.TabBrowser(aModule.controller);
  aModule.autoFillPopup = new popups.AutoFillPopup(aModule.controller);

  tabBrowser.closeAllTabs();
  forms.clear();
}

function teardownModule(aModule) {
  tabBrowser.closeAllTabs();
  forms.clear();
}

/**
 * Bug 879418: Test form completion
 */
function testFormCompletion() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var inputField = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  inputField.sendKeys(INPUT_TEXT);

  var submitButton = new elementslib.ID(controller.tabs.activeTab,
                                        "SubmitButton");
  submitButton.tap();
  controller.waitForPageLoad();

  // Open another page to see if form data is saved when accessing the test page again
  controller.open("about:blank");
  controller.waitForPageLoad();

  // Go back to the test page
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  autoFillPopup.open(() => {
    inputField.sendKeys(INPUT_TEXT.substring(0, 2));
  });

  autoFillPopup.close(() => {
    var autoFillItem = autoFillPopup.getElements({type: "results"})[0];
    autoFillItem.tap();
  });

  assert.equal(inputField.getNode().value, INPUT_TEXT,
               "Input field has the correct text");
}
