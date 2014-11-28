/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var prefs = require("../../../../../lib/prefs");

const BROWSER_HOME_PAGE = 'browser.startup.homepage';
const BROWSER_STARTUP_PAGE = 'browser.startup.page';
const PROXY_TYPE = 'network.proxy.type';

/**
 * Sets browser start up page, home page, and proxy settings
 */
var setupModule = function(aModule) {
  // Set browser home page to about:blank
  prefs.setPref(BROWSER_HOME_PAGE, "about:blank");

  // Set browser start up to display current home page
  prefs.setPref(BROWSER_STARTUP_PAGE, 1);

  // Set the proxy type in connection settings to 'Auto-detect proxy settings ...'
  prefs.setPref(PROXY_TYPE, 4);

  aModule.controller = mozmill.getBrowserController();
}

function teardownModule(aModule) {
  aModule.controller.restartApplication();
}
