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
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
 *   Anthony Hughes <ahughes@mozilla.com>
 *   Vlad Maniac <vlad.maniac@softvisioninc.eu>
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

// Include the required modules
var prefs = require("../../../lib/prefs");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'password_manager/login_form.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);

  pm = Cc["@mozilla.org/login-manager;1"].
       getService(Ci.nsILoginManager);
  pm.removeAllLogins();
}

var teardownModule = function(module) {
  // Just in case the test fails remove all passwords
  pm.removeAllLogins();
}

/**
 * Test the password post-submit notification
 */
var testPasswordNotification = function() {
  // Go to the sample login page and perform a test log-in with input fields
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var userField = new elementslib.ID(controller.tabs.activeTab, "uname");
  var passField = new elementslib.ID(controller.tabs.activeTab, "Password");

  controller.waitForElement(userField, TIMEOUT);
  controller.type(userField, "bar");
  controller.type(passField, "foo");

  // Click the login button and wait for the form to process
  var loginButton = new elementslib.ID(controller.tabs.activeTab, "LogIn"); 
  controller.click(loginButton);
  controller.waitForPageLoad();

  // Get a reference to the password-save notification
  var passwordNotification = locationBar.getNotificationElement(
                               "password-save-notification"
                             );

  // Close the notification and check its state
  controller.keypress(passwordNotification, "VK_ESCAPE", {});
  controller.waitFor(function () {
    return passwordNotification.getNode().parentNode.state === "closed";
  }, "Password notification has been closed");
}


