/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var downloads = require("../../../lib/downloads");
var utils = require("../../../lib/utils");

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  module.controller = mozmill.getBrowserController();

  // Get an instance of the Download Manager class
  module.dm = new downloads.downloadManager();
}

var teardownModule = function(module)
{
  // If we failed in closing the Download Manager window force it now
  dm.close(true);
}

/**
 * Test opening the Download Manager
 */
var testOpenDownloadManager = function()
{
  // Use the main menu
  dm.open(controller, false);
  dm.close();

  // Use the keyboard shortcuts
  dm.open(controller, true);
  dm.close();
}

/**
 * Map test functions to litmus tests
 */
// testOpenDownloadManager.meta = {litmusids : [7979]};

setupModule.__force_skip__ = "Bug 746766 - Landing of Downloads Panel broke Download Manager tests";
teardownModule.__force_skip__ = "Bug 746766 - Landing of Downloads Panel broke Download Manager tests";
