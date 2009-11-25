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
 * **** END LICENSE BLOCK *****/

/**
 * Litmus test #8024 & 5981: Access the Location Bar with drop down list
 */
const gTimeout = 5000;
const gDelay = 100;

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PlacesAPI'];

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  
  // Clear complete history so we don't get interference from previous entries
  try {
    var historyService = Cc["@mozilla.org/browser/nav-history-service;1"].
                     getService(Ci.nsINavHistoryService);
    historyService.removeAllPages();
  } 
  catch (ex) {}
}

/**
 * Check acces to the location bar drop down list via autocomplete
 */
var testAccessLocationBarHistory = function () {
  var locationBar = new elementslib.ID(controller.window.document, "urlbar");
  var websites = ['http://www.google.com/',
                  'http://www.mozilla.org/',
                  'http://www.getpersonas.com/',
                  'about:blank'];

  // Open a few different sites to create a small history (about:blank doesn't
  // appear in history and clears the page for clean test arena
  for (var k = 0; k < websites.length; k++) {
    controller.keypress(null, "l", {accelKey: true});
    controller.type(null, websites[k]);
    controller.keypress(null, "VK_RETURN", {});
    controller.waitForPageLoad();
  }

  // Open the autocomplete list from the location bar

  // First - Focus the locationbar then delete any contents there
  controller.keypress(null, "l", {accelKey: true});
  controller.keypress(null, "VK_DELETE", {});

  // Second - Arrow down to open the history list (displays most recent visit first),
  // then arrow down again to the first entry, in this case www.getpersonas.com;
  controller.keypress(null, "VK_DOWN", {});
  controller.sleep(gDelay);
  controller.keypress(null, "VK_DOWN", {});
  controller.sleep(gDelay);

  // checks that the first item in the drop down list is selected.
  var richlistbox = new elementslib.Lookup(controller.window.document, '/id("main-window")/id("mainPopupSet")/id("PopupAutoCompleteRichResult")/anon({"anonid":"richlistbox"})');
  controller.waitForEval("subject.selectedIndex == 0", gTimeout, 100, richlistbox.getNode());

  controller.assertJS("subject.value.indexOf('getpersonas') !== -1", locationBar.getNode());
  controller.keypress(null, "VK_RETURN", {});
  controller.waitForPageLoad();

  // Finally - Check that the personas page was loaded
  // Check for presense of Personsas image
  var personasImage = new elementslib.XPath(controller.tabs.activeTab, "/html/body/div[@id='outer-wrapper']/div[@id='inner-wrapper']/div[@id='nav']/h1/a/img");
  controller.waitForElement(personasImage, gTimeout, 100);

  // Check that getpersonas is in the url bar
  controller.assertJS("subject.value.indexOf('getpersonas') !== -1", locationBar.getNode());
}



