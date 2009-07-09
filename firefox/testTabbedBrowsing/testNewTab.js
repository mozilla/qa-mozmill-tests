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
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Tracy Walker <twalker@mozilla.com>
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

/**
 * Litmus test #6044: Open a New Tab
 */

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['UtilsAPI'];

const gDelay = 0;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

var teardownModule = function(module) {
  // Close the new Tab to reset state
  UtilsAPI.closeAllTabs(controller);
}

var checkNewTab = function() {
  // Check that two tabs are open and wait until the document has been finished loading
  controller.waitForEval("subject.length == 2", 1000, 100, controller.tabs);
  controller.waitForPageLoad(controller.tabs.activeTab);

  // Check that the new tab is opened and shows the correct title
  var title = UtilsAPI.getProperty("chrome://browser/locale/tabbrowser.properties", "tabs.untitled");
  var tabTitle = new elementslib.Lookup(controller.window.document,'/id("main-window")/id("browser")/id("appcontent")/id("content")/anon({"anonid":"tabbox"})/anon({"anonid":"strip"})/anon({"anonid":"tabcontainer"})/{"label":"'+ title +'"}/anon({"class":"tab-text"})')
  controller.assertNode(tabTitle);

  // Close the tab again
  controller.keypress(null, "w", {accelKey: true});
  controller.waitForEval("subject.length == 1", 1000, 100, controller.tabs);
}

var testNewTab = function () {
  // Make sure all tabs are closed
  UtilsAPI.closeAllTabs(controller);

  // Ensure current tab does not have blank page loaded
  controller.open('http://www.mozilla.org');
  controller.waitForPageLoad(controller.tabs.activeTab);
  controller.sleep(gDelay);

  // Open a new tab via the menu (by default it should open with an a blank (Untitled) page)
  controller.click(new elementslib.Elem(controller.menus['file-menu'].menu_newNavigatorTab));
  checkNewTab();
  controller.sleep(gDelay);

  // Use the shortcut to open a new tab
  controller.keypress(null, "t", {accelKey:true});
  checkNewTab();
  controller.sleep(gDelay);

  // Double click the empty tab strip left of the all tabs button to open a new tab
  var tabStrip = new elementslib.Lookup(controller.window.document, '/id("main-window")/id("browser")/id("appcontent")/id("content")/anon({"anonid":"tabbox"})/anon({"anonid":"strip"})/anon({"anonid":"tabcontainer"})/anon({"class":"tabs-stack"})/{"class":"tabs-container"}/anon({"anonid":"arrowscrollbox"})/anon({"anonid":"scrollbox"})/anon({"class":"box-inherit scrollbox-innerbox"})');

  controller.doubleClick(tabStrip, tabStrip.getNode().clientWidth - 100, 3);
  checkNewTab();
}
