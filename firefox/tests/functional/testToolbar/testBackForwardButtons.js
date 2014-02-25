/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert } = require("../../../../lib/assertions");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = [
  {url: BASE_URL + "layout/mozilla.html", id: "community"},
  {url: BASE_URL + "layout/mozilla_mission.html", id: "mission_statement"},
  {url: BASE_URL + "layout/mozilla_grants.html", id: "accessibility"}
];

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

/**
 * Test the back and forward buttons
 */
var testBackAndForward = function() {
  var backButton = new elementslib.ID(controller.window.document, "back-button");
  var forwardButton = new elementslib.ID(controller.window.document, "forward-button");

  // Open up the list of local pages statically assigned in the array
  for each (var localPage in TEST_DATA) {
    controller.open(localPage.url);
    controller.waitForPageLoad();

    var element = new elementslib.ID(controller.tabs.activeTab, localPage.id);
    assert.ok(element.exists(), "Page ID element has been found");
  }

  var transitionFinished = false;

  function onTransitionEnd() {
    transitionFinished = true;
    forwardButton.getNode().removeEventListener("transitionend", onTransitionEnd, false);
  }

  forwardButton.getNode().addEventListener("transitionend", onTransitionEnd, false);

  // Click on the Back button for the number of local pages visited
  for (var i = TEST_DATA.length - 2; i >= 0; i--) {
    controller.click(backButton);

    var element = new elementslib.ID(controller.tabs.activeTab, TEST_DATA[i].id);
    controller.waitForElement(element);
  }

  // Click on the Forward button for the number of websites visited
  for (var j = 1; j < TEST_DATA.length; j++) {
   assert.waitFor(function () {
     return transitionFinished && !forwardButton.getNode().hasAttribute('disabled');
   }, "The forward button has been made visible for the " + j + " page");

    controller.click(forwardButton);

    var element = new elementslib.ID(controller.tabs.activeTab, TEST_DATA[j].id);
    controller.waitForElement(element);
  }
}
