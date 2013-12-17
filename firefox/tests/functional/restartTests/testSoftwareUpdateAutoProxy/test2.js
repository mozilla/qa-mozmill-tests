/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var {expect} = require("../../../../../lib/assertions");
var prefs = require("../../../../lib/prefs");
var softwareUpdate = require("../../../../lib/software-update");

const BROWSER_HOME_PAGE = 'browser.startup.homepage';
const BROWSER_STARTUP_PAGE = 'browser.startup.page';
const PROXY_TYPE = 'network.proxy.type';

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.update = new softwareUpdate.softwareUpdate();

  if (!aModule.update.allowed)
    testSoftwareUpdateAutoProxy.__force_skip__ = "No permission to update Firefox.";
}

function teardownModule(aModule) {
  prefs.preferences.clearUserPref(BROWSER_HOME_PAGE);
  prefs.preferences.clearUserPref(BROWSER_STARTUP_PAGE);
  prefs.preferences.clearUserPref(PROXY_TYPE);

  // Bug 886811
  // Mozmill 1.5 does not have the stopApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("stopApplication" in aModule.controller) {
    aModule.controller.stopApplication(true);
  }
}

/**
 * Performs a check for a software update failure: 'Update XML file malformed (200)'
 */
function testSoftwareUpdateAutoProxy() {
  // Open the software update dialog and wait until the check has been finished
  update.openDialog(controller);
  update.waitForCheckFinished();

  expect.notEqual(update.currentPage, softwareUpdate.WIZARD_PAGES.errors,
                  "Update dialog wizard doesn't show 'Update XML file malformed (200)' error.");

  update.closeDialog();
}
