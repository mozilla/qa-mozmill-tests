/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var prefs = require("../../../lib/prefs");
var softwareUpdate = require("../../../lib/software-update");


const PREF_UPDATE_LOG = "app.update.log";


function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.update = new softwareUpdate.softwareUpdate();

  // Prepare persisted object for update results
  // If an update fails the post build has to be the same as the pre build.
  persisted.updateStagingPath = aModule.update.stagingDirectory.path;
  persisted.updateIndex = 0;

  persisted.updates = [{
    build_pre : aModule.update.buildInfo,
    build_post : aModule.update.buildInfo,
    patch : { },
    fallback : false,
    success : false
  }];

  // Turn on software update logging
  prefs.preferences.setPref(PREF_UPDATE_LOG, true);
}

function teardownModule(aModule) {
  // Bug 886811
  // Mozmill 1.5 does not have the restartApplication method on the controller.
  // startUserShutdown is broken in mozmill-2.0
  if ("restartApplication" in aModule.controller) {
    aModule.controller.restartApplication();
  }
}
