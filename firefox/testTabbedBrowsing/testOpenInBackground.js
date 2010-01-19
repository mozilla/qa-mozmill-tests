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
 * The Initial Developer of the Original Code is
 * Tobias Markus <tobbi.bugs@googlemail.com>.
 *
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
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

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrefsAPI', 'TabbedBrowsingAPI', 'UtilsAPI'];

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  tabBrowser = new TabbedBrowsingAPI.tabBrowser(controller);
  tabBrowser.closeAllTabs();
}

var teardownModule = function()
{
  PrefsAPI.preferences.clearUserPref("browser.tabs.loadInBackground");
  UtilsAPI.closeContentAreaContextMenu(controller);
}

var testOpenInBackgroundTab = function()
{
  PrefsAPI.preferencesDialog.open(prefDialogCallback);

  // Open a website
  controller.open('http://www.google.com/webhp?complete=1&hl=en');
  controller.waitForPageLoad();

  var googleImagesLink = new elementslib.XPath(controller.tabs.activeTab, "//div[@id='gbar']/nobr/a[1]");

  // Open link via context menu
  var contextMenuItem = new elementslib.ID(controller.window.document, "context-openlinkintab");
  controller.rightClick(googleImagesLink);
  controller.click(contextMenuItem);

  // Check that two tabs are open and the first is selected
  controller.waitForEval("subject.length == 2", gTimeout, 100, tabBrowser);
  controller.waitForEval("subject.selectedIndex == 0", gTimeout, 100, tabBrowser);

  // Open link via middle click
  // XXX: Can be changed to middleClick once bug 535018 is fixed
  controller.mouseDown(googleImagesLink, 1);
  controller.mouseUp(googleImagesLink, 1);

  // Check that three tabs are open and the first is selected
  controller.waitForEval("subject.length == 3", gTimeout, 100, tabBrowser);
  controller.waitForEval("subject.selectedIndex == 0", gTimeout, 100, tabBrowser);
}

var prefDialogCallback = function(controller) {
  PrefsAPI.preferencesDialog.setPane(controller, 'paneTabs');
  
  //Ensure that 'Switch to tabs immediately' is unchecked:
  var switchToTabsPref = new elementslib.ID(controller.window.document, "switchToNewTabs");
  controller.waitForElement(switchToTabsPref, gTimeout);
  controller.check(switchToTabsPref, false);

  PrefsAPI.preferencesDialog.close(controller, true);
}

/**
 * Map test functions to litmus tests
 */
testOpenInBackgroundTab.meta = {litmusids : [6045]};
