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
var MODULE_REQUIRES = ['PrefsAPI', 'UtilsAPI'];

const localTestFolder = collector.addHttpResource('./files');

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module)
{
  controller = mozmill.getBrowserController();

  UtilsAPI.closeAllTabs(controller);
}

var teardownModule = function()
{
  PrefsAPI.preferences.clearUserPref("browser.tabs.loadInBackground");
  
  
}

var testScrollBackgroundTabIntoView = function()
{
  var containerString = '/id("main-window")/id("browser")/id("appcontent")/id("content")/anon({"anonid":"tabbox"})/anon({"anonid":"strip"})/anon({"anonid":"tabcontainer"})/anon({"class":"tabs-stack"})/{"class":"tabs-container"}';

  var container = new elementslib.Lookup(controller.window.document, containerString);
  var scrollButtonDown = new elementslib.Lookup(controller.window.document, containerString +
                                                '/anon({"anonid":"arrowscrollbox"})/anon({"anonid":"scrollbutton-down"})');
  var scrollButtonUp = new elementslib.Lookup(controller.window.document, containerString +
                                              '/anon({"anonid":"arrowscrollbox"})/anon({"anonid":"scrollbutton-up"})');
  var allTabsButton = new elementslib.Lookup(controller.window.document,
                                             containerString + '/{"pack":"end"}/anon({"anonid":"alltabs-button"})');
  var animateBox = new elementslib.Lookup(controller.window.document,
                                          containerString + '/{"pack":"end"}/anon({"anonid":"alltabs-box-animate"})');
  var allTabsPopup = new elementslib.Lookup(controller.window.document,
                                     containerString + '/{"pack":"end"}/anon({"anonid":"alltabs-button"})' +
                                     '/anon({"anonid":"alltabs-popup"})');

  // Check that we open new tabs in the background
  PrefsAPI.preferencesDialog.open(prefDialogCallback);

  // Open the testcase
  controller.open(localTestFolder + "/openinnewtab.html");
  controller.waitForPageLoad();

  var link1 = new elementslib.Name(controller.tabs.activeTab, "link_1");
  var link2 = new elementslib.Name(controller.tabs.activeTab, "link_2");

  // Open new background tabs until the scroll arrows appear
  var count = 1;
  do {
    controller.mouseDown(link1, 1);
    controller.mouseUp(link1, 1);

    // Wait until the new tab has been opened
    controller.waitForEval("subject.length == " + (++count), gTimeout, 100, controller.tabs);
  } while ((container.getNode().getAttribute("overflow") != 'true') || count > 50)

  // Scroll arrows will be shown when the overflow attribute has been added
  controller.assertJS("subject.getAttribute('overflow') == 'true'",
                      container.getNode())

  // Open one more tab but with another link for later verification
  controller.mouseDown(link2, 1);
  controller.mouseUp(link2, 1);

  // Check that the List all Tabs button flashes
  controller.waitForEval("subject.window.getComputedStyle(subject.animateBox, null).opacity != 0",
                         gTimeout, 10, {window : controller.window, animateBox: animateBox.getNode()});
  controller.waitForEval("subject.window.getComputedStyle(subject.animateBox, null).opacity == 0",
                         gTimeout, 100, {window : controller.window, animateBox: animateBox.getNode()});

  // Check that the correct link has been loaded in the last tab
  var tabCount = controller.tabs.length -1;
  var linkId = new elementslib.ID(controller.tabs.getTab(tabCount), "id");
  controller.assertText(linkId, "2");

  // and is displayed inside the all tabs popup menu
  controller.click(allTabsButton);
  controller.waitForEval("subject.state == 'open'", gTimeout, 100, allTabsPopup.getNode());

  for (var ii = 0; ii <= tabCount; ii++) {
    if (ii < tabCount)
      controller.assertJS("subject.childNodes[" + ii + "].label != '2'",
                          allTabsPopup.getNode());
    else
      controller.assertJS("subject.childNodes[" + ii + "].label == '2'",
                          allTabsPopup.getNode());
  }
  
  controller.click(allTabsButton);
  controller.waitForEval("subject.state == 'closed'", gTimeout, 100, allTabsPopup.getNode());
}

/**
 * Check that we open tabs in the background
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(controller)
{
  PrefsAPI.preferencesDialog.setPane(controller, 'paneTabs');

  // Ensure that 'Switch to tabs immediately' is unchecked:
  var switchToTabsPref = new elementslib.ID(controller.window.document, "switchToNewTabs");
  controller.waitForElement(switchToTabsPref, gTimeout);
  controller.check(switchToTabsPref, false);

  PrefsAPI.preferencesDialog.close(controller, true);
}

/**
 * Map test functions to litmus tests
 */
testOpenInBackgroundTab.meta = {litmusids : [8259]};
