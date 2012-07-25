/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { expect } = require("../../../lib/assertions");
var prefs = require("../../../lib/prefs");
var privateBrowsing = require("../../../lib/private-browsing");
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const gDelay = 0;
const gTimeout = 7000;

const PREF_GEO_TOKEN = "geo.wifi.access_token";

const localTestFolder = collector.addHttpResource('../../../data/');

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  pb = new privateBrowsing.privateBrowsing(controller);
  tabBrowser = new tabs.tabBrowser(controller);
}

var teardownModule = function(module)
{
  pb.reset();
}

/**
 * Test that the content of all tabs (https) is reloaded when leaving PB mode
 */
var testTabRestoration = function()
{
  var available = false;
  var tokens = { };

  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  // Start Private Browsing
  pb.start();

  // Load a page which supports geolocation and accept sharing the location
  controller.open(localTestFolder + "geolocation/position.html");
  controller.waitForPageLoad();

  var shortcut = utils.getProperty("chrome://browser/locale/browser.properties",
                                      "geolocation.shareLocation.accesskey");
  controller.keypress(null, shortcut, {ctrlKey: mozmill.isMac, altKey: !mozmill.isMac});

  try {
    var result = new elementslib.ID(controller.tabs.activeTab, "result");
    controller.waitFor(function () {
      return results.getNode().innerHTML !== 'undefined';
    }, "Geolocation position has been found");
    available = true;
  } catch (ex) {}

  /* XXX: Bug 685805 - skip checking for geolocation tokens
  // If a position has been returned check for geo access tokens
  if (available) {
    prefs.preferences.prefBranch.getChildList(PREF_GEO_TOKEN, tokens);
    expect.ok(tokens.value > 0, "Geo access tokens present");
  }
  */

  // Stop Private Browsing
  pb.stop();

  /* XXX: Bug 685805 - skip checking for geolocation tokens
  // No geo access tokens should be present
  prefs.preferences.prefBranch.getChildList(PREF_GEO_TOKEN, tokens);
  expect.equal(tokens.value, 0, "No geo access token present");
  */
}
