/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var { assert } = require("../../../../lib/assertions");
var tabs = require("../../../lib/tabs");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "security/enable_privilege.html";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  tabs.closeAllTabs(aModule.controller);
}

function testEnablePrivilege() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var result = new elementslib.ID(controller.tabs.activeTab, "result");
  assert.equal(result.getNode().textContent, "PASS",
               "enablePrivilege is not accessible");
}
