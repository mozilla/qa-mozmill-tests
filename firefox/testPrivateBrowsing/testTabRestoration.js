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
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Anthony Hughes <ahughes@mozilla.com>
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
var privateBrowsing = require("../../shared-modules/testPrivateBrowsingAPI");
var tabs = require("../../shared-modules/testTabbedBrowsingAPI");
var utils = require("../../shared-modules/testUtilsAPI");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');
const LOCAL_TEST_PAGES = [
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla_contribute.html', id: 'localization'},
  {url: LOCAL_TEST_FOLDER + 'layout/mozilla_community.html', id: 'history'}
];

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  pb = new privateBrowsing.privateBrowsing(controller);

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();
}

var teardownModule = function(module) {
  pb.reset();
}

/**
 * Test that the content of all tabs (https) is reloaded when leaving PB mode
 */
var testTabRestoration = function() {
  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  LOCAL_TEST_PAGES.forEach(function(page) {
    controller.open(page.url);
    controller.waitForPageLoad();

    tabBrowser.openTab();
  });

  // Start Private Browsing
  pb.start();

  // Stop Private Browsing
  pb.stop();

  // All tabs should be restored
  controller.assertJS("subject.tabCountActual == subject.tabCountExpected",
                      {tabCountActual: controller.tabs.length,
                       tabCountExpected: LOCAL_TEST_PAGES.length + 1});

  // Check if all pages were re-loaded and show their content
  for (var i = 0; i < LOCAL_TEST_PAGES.length; i++) {
    controller.waitForPageLoad(controller.tabs.getTab(i));

    var elem = new elementslib.ID(controller.tabs.getTab(i), LOCAL_TEST_PAGES[i].id);
    controller.assertNode(elem);
  }
}

/**
 * Map test functions to litmus tests
 */
// testTabRestoration.meta = {litmusids : [9265]};
