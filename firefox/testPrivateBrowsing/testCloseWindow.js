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
 *   Aaron Train <atrain@mozilla.com>
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

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrivateBrowsingAPI', 'TabbedBrowsingAPI', 'UtilsAPI'];

const gDelay = 0;
const gTimeout = 5000;

var websites = [
                {url: 'https://addons.mozilla.org/', id: 'search-query'},
                {url: 'https://bugzilla.mozilla.org', id: 'quicksearch_top'}
               ];

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  pb = new PrivateBrowsingAPI.privateBrowsing(controller);
  tabBrowser = new TabbedBrowsingAPI.tabBrowser(controller);

  tabBrowser.closeAllTabs(controller);
}

var teardownModule = function(module) {
  pb.reset();
}

/**
 * Verify when closing window in private browsing that regular session is restored
 */
var testCloseWindow = function() {
  // Closing the only browser window while staying in Private Browsing mode
  // will quit the application on Windows and Linux. So only on the test on OS X.
  if (!mozmill.isMac)
    return;

  var windowCount = mozmill.utils.getWindows().length;

  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  // Open websites in separate tabs
  var newTab = new elementslib.Elem(controller.menus['file-menu'].menu_newNavigatorTab);
  for (var ii = 0; ii < websites.length; ii++) {
    controller.open(websites[ii].url);
    controller.click(newTab);
  }

  // Wait until all tabs have been finished loading
  for (var ii = 0; ii < websites.length; ii++) {
    var elem = new elementslib.ID(controller.tabs.getTab(ii), websites[ii].id);
    controller.waitForElement(elem, gTimeout);
  }

  // Start Private Browsing
  pb.start();

  // One single window will be opened in PB mode which has to be closed now
  var cmdKey = UtilsAPI.getEntity(tabBrowser.getDtds(), "closeCmd.key");
  controller.keypress(null, cmdKey, {accelKey: true});
  
  controller.waitForEval("subject.utils.getWindows().length == subject.expectedCount",
                         gTimeout, 100,
                         {utils: mozmill.utils, expectedCount: (windowCount - 1)});

  // Without a window any keypress and menu click will fail.
  // Flipping the pref directly will also do it.
  pb.enabled = false;
  controller.waitForEval("subject.utils.getWindows().length == subject.expectedCount",
                         gTimeout, 100,
                         {utils: mozmill.utils, expectedCount: windowCount});

  UtilsAPI.handleWindow("type", "navigator:browser", checkWindowOpen, true);
}

function checkWindowOpen(controller) {
  // All tabs should be restored
  controller.assertJS("subject.tabs.length == subject.expectedCount",
                      {tabs: controller.tabs, expectedCount: (websites.length + 1)});

  // Check if all pages were re-loaded and show their content
  for (var i = 0; i < websites.length; i++) {
    var tab = controller.tabs.getTab(i);
    var elem = new elementslib.ID(tab, websites[i].id);

    controller.waitForPageLoad(tab);
    controller.waitForElement(elem, gTimeout);
  }
}

/**
 * Map test functions to litmus tests
 */
// testCloseWindow.meta = {litmusids : [9267]};
