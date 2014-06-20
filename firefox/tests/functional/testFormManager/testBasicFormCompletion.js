/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { assert } = require("../../../../lib/assertions");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "form_manager/form.html";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  try {
    // Clear complete form history so we don't interfer with already added entries
    var formHistory = Cc["@mozilla.org/satchel/form-history;1"]
                      .getService(Ci.nsIFormHistory2);
    formHistory.removeAllEntries();
  }
  catch (ex) {
  }
}

var testFormCompletion = function() {
  var inputText = 'John';

  // Open the local site and verify it's the correct page
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var inputField = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  assert.ok(inputField.exists(), "Name field has been found");

  // Fill out the name field with the input text: 'John' and click the Submit button
  controller.type(inputField, inputText);

  var submitButton = new elementslib.ID(controller.tabs.activeTab, "SubmitButton");
  controller.click(submitButton);
  controller.waitForPageLoad();

  // Go to a filler site: about:blank
  controller.open("about:blank");
  controller.waitForPageLoad();

  // Go back to the starting local page
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Verify name field element, and type in a portion of the field
  inputField = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  controller.type(inputField, inputText);

  // Select the first element of the drop down
  var popDownAutoCompList = new elementslib.Lookup(controller.window.document,
                              '/id("main-window")' +
                              '/id("mainPopupSet")/id("PopupAutoComplete")' +
                              '/anon({"anonid":"tree"})/{"class":"autocomplete-treebody"}');

  controller.keypress(inputField, "VK_DOWN", {});
  controller.sleep(1000);
  controller.click(popDownAutoCompList);

  assert.equal(inputField.getNode().value, inputText,
               "Input field has the correct text in it");
}

