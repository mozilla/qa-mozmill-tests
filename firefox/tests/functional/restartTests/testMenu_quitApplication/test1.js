/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

/*
 * Test quitting the application
 */
function testQuitApplication() {
  controller.startUserShutdown(4000, false);
  controller.mainMenu.click("#menu_FileQuitItem");
}

/**
 * Map test functions to moztrap tests
 */
testQuitApplication.meta = {moztrap_case: 333};
