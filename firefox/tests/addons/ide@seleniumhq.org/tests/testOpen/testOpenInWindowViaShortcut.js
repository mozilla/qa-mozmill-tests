/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var {assert} = require("../../../../../../lib/assertions");
var selenium = require("../../lib/selenium");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.sm = new selenium.SeleniumManager();
}

function teardownModule(aModule) {
  aModule.sm.close();
}

function testOpenInWindowViaMenu() {
  sm.open(controller, "shortcut");
  assert.ok(sm.controller, "Selenium IDE has been opened.");
}
