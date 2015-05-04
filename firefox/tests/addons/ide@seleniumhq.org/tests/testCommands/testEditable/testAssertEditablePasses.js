/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var {assert} = require("../../../../../../../lib/assertions");
var checks = require("../../../lib/checks");
var selenium = require("../../../lib/selenium");
var tabs = require("../../../../../../lib/tabs");

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  tabs.closeAllTabs(aModule.controller);

  aModule.sm = new selenium.SeleniumManager();
  aModule.sm.open(aModule.controller);

  aModule.controller.open("chrome://selenium-ide/content/tests/functional/aut/disabled.html");
  aModule.controller.waitForPageLoad();
}

function teardownModule(aModule) {
  aModule.sm.close();
}

function testAssertEditableCommandPasses() {
  sm.addCommand({action: "assertEditable",
                target: "css=input[name=monkeys]"});
  sm.addCommand({action: "echo",
                target: "final command"});
  sm.playTest();

  checks.commandPassed(sm);

  //check final command is executed
  assert.equal(sm.finalLogEchoInfoMessage, "echo: final command");
}
