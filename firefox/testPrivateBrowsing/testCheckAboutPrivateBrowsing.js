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

/**
 *  Litmus test #7463: Verify about:privatebrowsing in private browsing mode
 */

var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['PrivateBrowsingAPI', 'UtilsAPI'];

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();

  // Create Private Browsing instance and set handler
  module.pb = new PrivateBrowsingAPI.privateBrowsing(controller);
}

var teardownModule = function(module) {
  pb.showPrompt = true;
  pb.enabled = false;
}

/**
 * Verify about:privatebrowsing in private browsing mode
 */
var testCheckAboutPrivateBrowsing = function()
{
  var targetURL = "http://support.mozilla.com/kb/Private+Browsing?style_mode=inproduct";

  // Make sure we are not in PB mode and don't show a prompt
  pb.enabled = false;
  pb.showPrompt = false;

  // Start the Private Browsing mode
  pb.start();

  var moreInfo = new elementslib.ID(controller.tabs.activeTab, "moreInfoLink");
  controller.waitThenClick(moreInfo, gTimeout);

  // Clicking on the more info link opens a new tab with a page on SUMO
  controller.waitForEval("subject.length == 2", gTimeout, 100, controller.tabs);
  controller.waitForPageLoad();

  var locationBar = new elementslib.ID(controller.window.document, "urlbar");
  var pbUrl = locationBar.getNode().value;

  // Check that the correct page has been loaded
  controller.open(targetURL);
  controller.waitForPageLoad();
  controller.assertValue(locationBar, pbUrl);

  pb.stop();
}
