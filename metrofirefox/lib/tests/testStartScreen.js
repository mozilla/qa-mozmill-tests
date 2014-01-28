/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { expect } = require("../../../lib/assertions");
var startScreen = require("../ui/startScreen");

const ELEMENTS = [
  {name: "bookmarks", type: "vbox"},
  {name: "history", type: "vbox"},
  {name: "topSites", type: "vbox"}
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.startScreen = new startScreen.StartScreen(aModule.controller);
}

function testStartPage() {
  controller.open("about:start");
  controller.waitForPageLoad();

  // Check the containers on the main page
  ELEMENTS.forEach(function (aElement) {
    var element = startScreen.getElement({type: aElement.name});
    expect.equal(element.getNode().localName, aElement.type,
                 aElement.name + " exists");
  });
}
