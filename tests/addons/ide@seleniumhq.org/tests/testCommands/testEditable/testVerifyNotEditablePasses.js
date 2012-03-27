/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var selenium = require("../../../lib/selenium");
var checks = require("../../../lib/checks");

function setupModule(module) {
  controller = mozmill.getBrowserController();
  sm = new selenium.SeleniumManager();
}

function teardownModule(module) {
  sm.close();
}

function testVerifyNotEditableCommandPasses() {
  sm.open(controller);
  sm.baseURL = "chrome://selenium-ide/";
  sm.addCommand({action: "open",
                target: "/content/tests/functional/aut/disabled.html"});
  sm.addCommand({action: "verifyNotEditable",
                target: "css=input[name=elephants]"});
  sm.addCommand({action: "echo",
                target: "final command"});
  sm.playTest();

  checks.commandPassed(sm);
  
  //check final command is executed
  sm.controller.assert(function () {
    return sm.finalLogInfoMessage === "echo: final command";
  }, "Final command was executed, got '" + sm.finalLogInfoMessage +"' expected 'echo: final command'");
}
