/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


// Include required modules
var prefs = require("../../../lib/prefs");
var softwareUpdate = require("../../../lib/software-update");


const PREF_UPDATE_LOG = "app.update.log";


function setupModule(module) {
  update = new softwareUpdate.softwareUpdate();

  // Prepare persisted object for update results
  // If an update fails the post build has to be the same as the pre build.
  persisted.updateStagingPath = update.stagingDirectory.path;
  persisted.updateIndex = 0;

  persisted.updates = [{
    build_pre : update.buildInfo,
    build_post : update.buildInfo,
    patch : { },
    fallback : false,
    success : false
  }];

  // Turn on software update logging
  prefs.preferences.setPref(PREF_UPDATE_LOG, true);
}
