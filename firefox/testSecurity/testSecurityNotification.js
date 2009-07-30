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
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
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
 * Litmus test #5920: Security notification
 */

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['UtilsAPI','PrefsAPI'];

const gDelay = 0;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

var testSecNotification = function() {

  // Close all tabs and open a blank page
  UtilsAPI.closeAllTabs(controller);

  // Go to the secure HTTPS Verisign site
  controller.open('https://www.verisign.com/');
  controller.waitForPageLoad(controller.tabs.activeTab);

  var aboutVer = new elementslib.Link(controller.tabs.activeTab, "About VeriSign");
  controller.assertNode(aboutVer);

  // Assign elements needed for verification of HTTPS sites
  var identLabel = new elementslib.ID(controller.window.document, "identity-icon-label");
  var cssSecButton = controller.window.getComputedStyle(controller.window.document.getElementById("security-button"), "");
  var cssInfo = controller.window.getComputedStyle(controller.window.document.getElementById("identity-box"), "");

  // Verify Verisign label
  controller.assertValue(identLabel, 'VeriSign, Inc. (US)');

  if (cssSecButton.getPropertyValue('list-style-image') != 'url(chrome://browser/skin/Secure-statusbar.png)') {
    throw 'Security button in status bar not visible when it should be';
  }

  if (cssInfo.getPropertyValue('background-image') != 'url(chrome://browser/skin/urlbar/startcap-verified-start.png)') {
    throw 'Identity Box is not shown with a green background when it should be';
  }

  // Go to the unsecure HTTP Verisign site
  controller.open('http://www.verisign.com');
  controller.waitForPageLoad(controller.tabs.activeTab);
  controller.assertNode(aboutVer);

  // Verify security functionality of http verisign site
  if (cssSecButton.getPropertyValue('list-style-image') != 'none') {
    throw 'Security button in status bar visible when it should not be';
  }

  if (cssInfo.getPropertyValue('background-image') != 'url(chrome://browser/skin/urlbar/startcap.png)') {
    throw 'Identity Box is not shown with a gray background when it should be';
  }

  // Go to a Verisign page which does not have a valid cert
  controller.open('https://verisign.com');
  controller.waitForPageLoad(controller.tabs.activeTab, 1000);

  // Verify security functionality in HTTPS certificate exception page
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "cert_domain_link"));
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "getMeOutOfHereButton"));
  controller.assertNode(new elementslib.ID(controller.tabs.activeTab, "exceptionDialogButton"));
}
