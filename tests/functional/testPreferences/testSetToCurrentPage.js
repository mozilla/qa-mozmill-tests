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
 * The Original Code is Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
 *   Alex Lakatos <alex.lakatos@softvision.ro>
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
var prefs = require("../../../lib/prefs");
var tabs = require("../../../lib/tabs");
var toolbars = require("../../../lib/toolbars");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

const BROWSER_HOMEPAGE = "browser.startup.homepage";

function setupModule() {
  controller = mozmill.getBrowserController();
  locationBar = new toolbars.locationBar(controller);

  tabs.closeAllTabs(controller);
}

function teardownModule(module) {
  prefs.preferences.clearUserPref(BROWSER_HOMEPAGE);
}

/**
 * Set homepage to current page
 */
function testSetHomePage() {
  // Go to the local page and verify the correct page has loaded
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var link = new elementslib.Link(controller.tabs.activeTab, "Community");
  controller.assertNode(link);

  // Call Prefs Dialog and set Home Page
  prefs.openPreferencesDialog(controller, prefDialogHomePageCallback);

  tabs.closeAllTabs(controller);

  // Go to the saved home page and verify it's the correct page
  var homeButton = new elementslib.ID(controller.window.document, "home-button");
  controller.click(homeButton);
  controller.waitForPageLoad();

  // Verify location bar with the saved home page
  controller.assertValue(locationBar.urlbar, LOCAL_TEST_PAGE);
}

/**
 * Set the current page as home page
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function prefDialogHomePageCallback(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneMain';

  // Set Home Page to the current page
  var useCurrent = new elementslib.ID(controller.window.document, "useCurrent");
  controller.click(useCurrent);

  prefDialog.close(true);
}

