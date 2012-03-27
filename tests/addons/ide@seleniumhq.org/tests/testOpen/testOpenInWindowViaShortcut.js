/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var {assert} = require("../../../../../lib/assertions");
var selenium = require("../../lib/selenium");

function setupModule(module) {
  controller = mozmill.getBrowserController();
  sm = new selenium.SeleniumManager();
}

function teardownModule(module) {
  sm.close();
}

function testOpenInWindowViaMenu() {
  sm.open(controller, "shortcut");
  assert.ok(sm.controller, "Selenium IDE has been opened.");
}
