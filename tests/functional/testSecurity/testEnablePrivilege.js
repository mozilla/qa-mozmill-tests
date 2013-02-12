/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { assert } = require("../../../lib/assertions");
var tabs = require("../../../lib/tabs");

const LOCAL_TEST_FOLDER = collector.addHttpResource("../../../data/");
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + "security/enable_privilege.html";

function setupModule() {
  controller = mozmill.getBrowserController();

  tabs.closeAllTabs(controller);
}

function testEnablePrivilege() {
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var result = new elementslib.ID(controller.tabs.activeTab, "result");
  assert.equal(result.getNode().textContent, "PASS",
               "enablePrivilege is not accessible");
}
