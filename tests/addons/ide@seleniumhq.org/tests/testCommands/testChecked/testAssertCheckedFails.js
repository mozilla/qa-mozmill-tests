/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var selenium = require("../../../lib/selenium");
var checks = require("../../../lib/checks");

function setupModule(module) {
  controller = mozmill.getBrowserController();
  sm = new selenium.SeleniumManager();
  sm.open(controller);
}

function teardownModule(module) {
  sm.close();
}

function testAssertCheckedCommandFails() {
  sm.baseURL = "chrome://selenium-ide/";
  sm.addCommand({action: "open",
                target: "/content/tests/functional/aut/checksandradios.html"});
  sm.addCommand({action: "assertChecked",
                target: "css=input[name=elephants]"});
  sm.addCommand({action: "echo",
                target: "final command"});
  sm.playTest();

  checks.commandFailed(sm, "false");
  
  //check final command is not executed
  sm.controller.assert(function () {
    return sm.finalLogInfoMessage !== "echo: final command";
  }, "Final command was not executed, got '" + sm.finalLogInfoMessage +"'");
}
