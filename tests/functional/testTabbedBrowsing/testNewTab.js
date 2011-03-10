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
 *   Tracy Walker <twalker@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Anthony Hughes <ahughes@mozilla.com>
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
var tabs = require("../../../lib/tabs");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  tabBrowser = new tabs.tabBrowser(controller);
  tabBrowser.closeAllTabs();
}

var testNewTab = function()
{
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  // Ensure current tab does not have blank page loaded
  var section = new elementslib.ID(controller.tabs.activeTab, "organization");
  controller.waitForElement(section);

  // Test all different ways to open a tab
  checkOpenTab({type: "menu"});
  checkOpenTab({type: "shortcut"});

  // NOTE: This feature is disabled on Linux (Bug 635397)
  if (!mozmill.isLinux) {
   checkOpenTab({type: "tabStrip"});
  }

  checkOpenTab({type: "newTabButton"});
}

/**
 * Check if a new tab has been opened, has a title and can be closed
 *
 * @param {object} event
 *        Object which specifies how to open the new tab
 */
var checkOpenTab = function(event)
{
  // Open a new tab and check that 'about:blank' has been opened
  tabBrowser.openTab(event);

  controller.waitFor(function () { 
    return controller.tabs.length === 2;
  }, "A new tab has opened via " + event.type + " - got " + 
    "'" + controller.tabs.length + "'" + ", expected " + "'" + 2 + "'");
  
  controller.assert(function () {
    return controller.tabs.activeTab.location == "about:blank";
  }, "The new tab opened via " + event.type + " - got " +
    controller.tabs.activeTab.location + ", expected " + "'about:blank'");
  
  // The tabs title should be 'New Tab'
  var title = utils.getProperty(["chrome://browser/locale/tabbrowser.properties"],
                                    "tabs.emptyTabTitle");
  var tab = tabBrowser.getTab();
  
  controller.assert(function () {
    return tab.getNode().label === title;
  }, "The new tab opened via " + event.type + " - got " + 
    "'" + tab.getNode().label + "'" + ", expected " + "'" + title + "'");

  // Close the tab again
  tabBrowser.closeTab({type: "shortcut"});

  controller.waitFor(function () {
    return controller.tabs.length === 1;
  }, "The new tab closed via shortcut - got " + "'" + controller.tabs.length +
    "'" + ", expected " + "'" + 1 + "'");
}

/**
 * Map test functions to litmus tests
 */
// testNewTab.meta = {litmusids : [8086]};
