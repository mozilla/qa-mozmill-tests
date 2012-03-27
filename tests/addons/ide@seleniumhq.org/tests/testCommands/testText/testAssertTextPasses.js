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

function testAssertTextCommandPasses() {
  sm.baseURL = "chrome://selenium-ide/";
  sm.addCommand({action: "open",
                target: "/content/tests/functional/aut/search.html"});
  sm.addCommand({action: "assertText",
                target: "link=link with onclick attribute",
                value: "link with onclick attribute"});
  sm.addCommand({action: "echo",
                target: "final command"});
  sm.playTest();

  checks.commandPassed(sm);
  
  //check final command is executed
  sm.controller.assert(function () {
    return sm.finalLogInfoMessage === "echo: final command";
  }, "Final command was executed, got '" + sm.finalLogInfoMessage +"' expected 'echo: final command'");
}
