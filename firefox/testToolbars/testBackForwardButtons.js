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
 * The Original Code is Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
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
 * Litmus test #5990: Back and Forward buttons
 */

// Global timeout value
const gTimeout = 10000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testBackandForward = function() {
  var websites = ['http://www.google.com/webhp?hl=en&complete=1', 'http://www.cnn.com/', 'http://www.msn.com/'];
  var pageElements = ['guser', 'cnnHeadSrchTxt', 'f1'];

  // Open up the list of websites statically assigned in the array
  for (var k = 0; k < websites.length; k++) {
    controller.open(websites[k]);
    controller.waitForPageLoad(controller.tabs.activeTab);
    controller.waitForElement(new elementslib.ID(controller.tabs.activeTab, pageElements[k]), gTimeout);
  }

  // Click on the Back button for the number of websites visited
  for (var i = websites.length - 2; i >= 0; i--) {
    controller.goBack();
    controller.waitForPageLoad(controller.tabs.activeTab);
    controller.waitForElement(new elementslib.ID(controller.tabs.activeTab, pageElements[i]), gTimeout);
  }

  // Click on the Forward button for the number of websites visited
  for (var j = 1; j < websites.length; j++) {
    controller.goForward();
    controller.waitForPageLoad(controller.tabs.activeTab);
    controller.waitForElement(new elementslib.ID(controller.tabs.activeTab, pageElements[j]), gTimeout);
  }
}
