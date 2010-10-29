/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Anthony Hughes <ahughes@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Include the required modules
var prefs = require("../../shared-modules/prefs");
var privateBrowsing = require("../../shared-modules/private-browsing");
var tabs = require("../../shared-modules/tabs");
var utils = require("../../shared-modules/utils");

const gDelay = 0;
const gTimeout = 7000;

const PREF_GEO_TOKEN = "geo.wifi.access_token";

const localTestFolder = collector.addHttpResource('../test-files/');

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
    controller.waitForEval("subject.innerHTML != 'undefined'", gTimeout, 100,
                           result.getNode());
    available = true;
  } catch (ex) {}

  // If a position has been returned check for geo access tokens
  if (available) {
    prefs.preferences.prefBranch.getChildList(PREF_GEO_TOKEN, tokens);
    controller.assertJS("subject.hasGeoTokens == true",
                        {hasGeoTokens: tokens.value > 0});
  }

  // Stop Private Browsing
  pb.stop();

  // No geo access tokens should be present
  prefs.preferences.prefBranch.getChildList(PREF_GEO_TOKEN, tokens);
  controller.assertJS("subject.hasNoGeoTokens == true",
                      {hasNoGeoTokens: tokens.value == 0});
}
