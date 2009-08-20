/* * ***** BEGIN LICENSE BLOCK *****
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
 * **** END LICENSE BLOCK ***** */

/**
 * Litmus test #9265: Verify SSL sites load after switching back to regular browsing from Private Browsing
 * Litmus test #9317: Verify no private browsing content shown when switching browsing modes
 */

var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrivateBrowsingAPI', 'UtilsAPI'];

const gDelay = 0;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  UtilsAPI.closeAllTabs(controller);

  // Create Private Browsing instance
  pb = new PrivateBrowsingAPI.privateBrowsing(controller);
}

var teardownModule = function(module) {
  // Reset Private Browsing options
  pb.showPrompt = true;
  pb.enabled = false;
}

/**
 * Test that the content of all tabs (http, https), which were loaded before the
 * transistion into PB mode, is loaded when leaving PB mode
 */
var testTabRestoration = function() {
  var urls = [{url: 'http://www.mozilla.org', id: 'q'},
              {url: 'https://bugzilla.mozilla.org', id: 'content'},
              {url: 'about:', id: 'aboutPageList'}
             ];

  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  // Open urls in separate tabs after closing existing tabs
  var newTab = new elementslib.Elem(controller.menus['file-menu'].menu_newNavigatorTab);

  for (var ii = 0; ii < urls.length; ii++) {
    controller.open(urls[ii].url);
    controller.click(newTab);
  }

  // Wait until all tabs have been finished loading
  for (var ii = 0; ii < urls.length; ii++) {
    var elem = new elementslib.ID(controller.tabs.getTab(ii), urls[ii].id);
    controller.waitForElement(elem, gTimeout);
  }

  // Start Private Browsing
  pb.start();
  controller.sleep(gDelay);

  // Open a page which should be removed after leaving Private Browsing mode
  controller.open("http://www.google.com/webhp?complete=1&hl=en");
  controller.waitForPageLoad();
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "logo"));

  // Check if Private Browsing mode is active
  if (!pb.enabled)
    throw "Private Browsing mode hasn't been started";

  pb.stop();
  controller.sleep(gDelay);

  if (controller.tabs.length != urls.length + 1)
    throw "Not all tabs were reopened after leaving Private Browsing mode";

  // Check if pages were loaded
  for (var ii = 0; ii < urls.length; ii++) {
    var elem = new elementslib.ID(controller.tabs.getTab(ii), urls[ii].id);
    controller.waitForElement(elem, gTimeout);
  }
}
