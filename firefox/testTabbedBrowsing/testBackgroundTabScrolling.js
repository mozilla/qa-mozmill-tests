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
 *   Anthony Hughes <ahughes@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Geo Mealer <gmealer@mozilla.com>
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

// Include required modules
var prefs = require("../../shared-modules/prefs");
var tabs = require("../../shared-modules/tabs");

const localTestFolder = collector.addHttpResource('../test-files/');

const TIMEOUT_ARROWS = 10000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();

  scrollButtonDown = tabBrowser.getElement({type: "tabs_scrollButton", subtype: "down"});
  scrollButtonUp = tabBrowser.getElement({type: "tabs_scrollButton", subtype: "up"});
  allTabsButton = tabBrowser.getElement({type: "tabs_allTabsButton"});
  allTabsPopup = tabBrowser.getElement({type: "tabs_allTabsPopup"});
}

var teardownModule = function()
{
  prefs.preferences.clearUserPref("browser.tabs.loadInBackground");
  tabBrowser.closeAllTabs();

  // Just in case the popup hasn't been closed yet
  allTabsPopup.getNode().hidePopup();
}

var testScrollBackgroundTabIntoView = function()
{
  // Check that we open new tabs in the background
  prefs.openPreferencesDialog(controller, prefDialogCallback);

  // Open the testcase
  controller.open(localTestFolder + "tabbedbrowsing/openinnewtab.html");
  controller.waitForPageLoad();

  var link1 = new elementslib.Name(controller.tabs.activeTab, "link_1");
  var link2 = new elementslib.Name(controller.tabs.activeTab, "link_2");

  controller.waitFor(function () {
    tabBrowser.openInNewTab({type: "middleClick", target: link1});

    // Wait until the pages have been loaded, so they can be loaded from the cache
    var tab = controller.tabs.getTab(controller.tabs.length - 1);
    controller.waitForPageLoad(tab);

    var down_visible = !scrollButtonDown.getNode().hasAttribute("collapsed");
    var up_visible = !scrollButtonUp.getNode().hasAttribute("collapsed");
    return down_visible && up_visible;
  }, "Scroll arrows are visible after a couple tabs have been opened", TIMEOUT_ARROWS);

  // XXX: Bug 624027
  // Not sure for which state we have to wait here, but without the sleep
  // call or smaller numbers the test always fails on Windows. Lets see
  // if the fix for bug 578162 will solve it.
  controller.sleep(100);

  // Open one more tab but with another link for later verification
  tabBrowser.openInNewTab({type: "middleClick", target: link2});

  // Check that the right scroll button flashes
  controller.waitFor(function () {
    return scrollButtonDown.getNode().hasAttribute('notifybgtab');
  }, "Right scroll arrow has been highlighted");

  controller.waitFor(function () {
    return !scrollButtonDown.getNode().hasAttribute('notifybgtab');
  }, "Hightlight should be removed immediately");

  // Check that the correct link has been loaded in the last tab
  var lastTabIndex = controller.tabs.length - 1;
  var linkId = new elementslib.ID(controller.tabs.getTab(lastTabIndex), "id");

  // Need to wait for element to appear, then we check text is correct
  controller.waitForElement(linkId);
  controller.assertText(linkId, "2");

  // and is displayed inside the all tabs popup menu
  controller.click(allTabsButton);

  controller.waitFor(function () {
    return allTabsPopup.getNode().state == 'open';
  }, "The all tabs popup should have been opened");

  // Check that the correct title is shown for all tabs except the last one
  // Last tab in the 'List all Tabs' menu 
  var lastMenuItemIndex = allTabsPopup.getNode().childNodes.length - 1; 
  
  for (var i = 3; i < lastMenuItemIndex; i++) {
    controller.waitFor(function () {
      var node = allTabsPopup.getNode().childNodes[i];
      return node && node.label == '1';
    }, "Link 1 title is visible for the tab");
  }

  // Also check the last title
  controller.waitFor(function () {
    var node = allTabsPopup.getNode().childNodes[lastMenuItemIndex];
    return node && node.label == '2';
  }, "Link 2 title is visible for the last tab");

  // Close the all tabs menu
  controller.click(allTabsButton);
  controller.waitFor(function () {
    return allTabsPopup.getNode().state == 'closed';
  }, "The all tabs popup should have been closed");
}

/**
 * Check that we open tabs in the background
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(controller)
{
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneTabs';

  // Ensure that 'Switch to tabs immediately' is unchecked:
  var switchToTabsPref = new elementslib.ID(controller.window.document, "switchToNewTabs");
  controller.waitForElement(switchToTabsPref);
  controller.check(switchToTabsPref, false);

  prefDialog.close(true);
}

/**
 * Map test functions to litmus tests
 */
// testOpenInBackgroundTab.meta = {litmusids : [8259]};
