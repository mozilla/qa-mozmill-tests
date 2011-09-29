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
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Vlad Maniac <vlad.maniac@softvisioninc.eu> (original author)
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
var endurance = require("../../../lib/endurance");
var tabs = require("../../../lib/tabs");

const TEST_DOMAIN = "http://www.mozqa.com/";
const TEST_PAGE = TEST_DOMAIN + "data/firefox/plugins/flash/sample-swf-video.swf";

const TIMEOUT_PAGE = 50000;

function setupModule() {
  controller = mozmill.getBrowserController();

  enduranceManager = new endurance.EnduranceManager(controller);
  tabBrowser = new tabs.tabBrowser(controller);

  tabs.closeAllTabs(controller);
}

/*
 * Test opening flash content via url
 */
function testFlashURL() {
  enduranceManager.run(function () {
    enduranceManager.loop(function () {
      // If entity > 1 then open a new tab 
      if (enduranceManager.currentEntity > 1) {
        tabBrowser.openTab();
      } 

      // Load the test page in the currently opened tab
      enduranceManager.addCheckpoint("Load a web page with .swf flash content");
      controller.open(TEST_PAGE);
      controller.waitForPageLoad(TIMEOUT_PAGE);
      enduranceManager.addCheckpoint("Web page has been loaded"); 
    });
    // Close all tabs
    tabBrowser.closeAllTabs();
  });
}
