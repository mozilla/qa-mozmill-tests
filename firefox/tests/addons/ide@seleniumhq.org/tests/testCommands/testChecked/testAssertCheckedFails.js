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

  aModule.controller.open("chrome://selenium-ide/content/tests/functional/aut/checksandradios.html");
  aModule.controller.waitForPageLoad();
}

function teardownModule(aModule) {
  aModule.sm.close();
}

function testAssertCheckedCommandFails() {
  sm.addCommand({action: "assertChecked",
                target: "css=input[name=elephants]"});
  sm.addCommand({action: "echo",
                target: "final command"});
  sm.playTest();

  checks.commandFailed(sm, "false");

  //check final command is not executed
  assert.notEqual(sm.finalLogEchoInfoMessage, "echo: final command");
}
