/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var prefs = require("../../../lib/prefs");
var softwareUpdate = require("../../../lib/software-update");


const PREF_UPDATE_LOG = "app.update.log";
const PREF_UPDATE_URL_OVERRIDE = "app.update.url.override";


function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.update = new softwareUpdate.softwareUpdate();

  // Prepare persisted object for update results
  // If an update fails the post build will be the same as the pre build.
  persisted.update.index = 0;
  persisted.update.stagingPath = aModule.update.stagingDirectory.path;

  // TODO: For backward compatibility. Can be removed once the issue is fixed:
  // https://github.com/mozilla/mozmill-automation/issues/164
  persisted.updateStagingPath = aModule.update.stagingDirectory.path;

  // Create results object with information of the unmodified pre build
  // TODO: Lets change to persisted.update.results once the issue is fixed:
  // https://github.com/mozilla/mozmill-automation/issues/164
  persisted.updates = [{
    build_pre : aModule.update.buildInfo,
    build_post : aModule.update.buildInfo,
    patch : { },
    fallback : false,
    success : false
  }];

  // Turn on software update logging
  prefs.preferences.setPref(PREF_UPDATE_LOG, true);

  // If requested force a specific update URL
  if (persisted.update.update_url) {
    prefs.preferences.setPref(PREF_UPDATE_URL_OVERRIDE,
                              persisted.update.update_url);
  }

  // If requested modify the default update channel. It will be active
  // after the next restart of the application
  if (persisted.update.channel) {
    // TODO: Keep backup as long as the update script doesn't restore the file
    persisted.update.origChannel = aModule.update.defaultChannel;
    aModule.update.defaultChannel = persisted.update.channel;
  }

  // If requested modify the list of allowed MAR channels
  if (persisted.update.allowed_mar_channels) {
    aModule.update.marChannels.add(persisted.update.allowed_mar_channels);
  }
}

function teardownModule(aModule) {
  aModule.controller.restartApplication();
}
