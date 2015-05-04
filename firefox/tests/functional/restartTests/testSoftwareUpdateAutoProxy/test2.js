/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var {expect} = require("../../../../../lib/assertions");
var prefs = require("../../../../../lib/prefs");
var softwareUpdate = require("../../../../lib/software-update");

var updateWizard = require("../../../../lib/ui/update-wizard");

const BROWSER_HOME_PAGE = 'browser.startup.homepage';
const BROWSER_STARTUP_PAGE = 'browser.startup.page';
const PROXY_TYPE = 'network.proxy.type';

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.update = new softwareUpdate.SoftwareUpdate();

  if (!aModule.update.allowed)
    testSoftwareUpdateAutoProxy.__force_skip__ = "No permission to update Firefox.";
}

function teardownModule(aModule) {
  prefs.clearUserPref(BROWSER_HOME_PAGE);
  prefs.clearUserPref(BROWSER_STARTUP_PAGE);
  prefs.clearUserPref(PROXY_TYPE);

  aModule.controller.stopApplication(true);
}

/**
 * Performs a check for a software update failure: 'Update XML file malformed (200)'
 */
function testSoftwareUpdateAutoProxy() {
  // Open the software update dialog and wait until the check has been finished
  var updatePrompt = Cc["@mozilla.org/updates/update-prompt;1"]
                     .createInstance(Ci.nsIUpdatePrompt);
  updatePrompt.checkForUpdates();

  var update = updateWizard.handleUpdateWizardDialog();
  update.waitForWizardPageChanged(updateWizard.WIZARD_PAGES.checking);

  expect.notEqual(update.currentPage, updateWizard.WIZARD_PAGES.errors,
                  "Update dialog wizard doesn't show 'Update XML file malformed (200)' error.");

  update.close();
}
