/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include the required modules
var { expect } = require("../../../lib/assertions");
var flyoutPanel = require("../ui/flyoutPanel");

const ELEMENTS = [
  {name: "about", type: "flyoutpanel"},
  {name: "options", type: "flyoutpanel"},
  {name: "search", type: "flyoutpanel"}
];

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.flyoutPanel = new flyoutPanel.FlyoutPanel(aModule.controller);
}

function testFlyoutPanel() {
  ELEMENTS.forEach(function (aElement) {
    var element = flyoutPanel.getElement({type: aElement.name});
    expect.equal(element.getNode().localName, aElement.type,
                 aElement.name + " exists");
  });
}
