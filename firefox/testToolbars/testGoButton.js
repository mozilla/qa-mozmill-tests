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
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Anthony Hughes <ahughes@mozilla.com>
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

/** This test script is for testing 
 *  Litmus Test Case #5914: location Field and Go button
 *  https://litmus.mozilla.org/show_test.cgi?id=5914
 */

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['UtilsAPI'];

var gDelay = 0;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}
 
/**
 * Test to make sure the GO button only appears while typing.
 */
var testGoButtonOnTypeOnly = function() {
  // Start from a web page
  controller.open("http://www.mozilla.org");
  controller.waitForPageLoad();
   
  // Verify GO button is hidden
  var goButton = new elementslib.ID(controller.window.document, "go-button");
  UtilsAPI.assertElementVisible(controller, goButton, false);

  var locationBar = new elementslib.ID(controller.window.document, "urlbar");
  
  // Focus and type a single character into the location bar
  controller.keypress(null, "l", {metaKey: mozmill.isMac, ctrlKey: !mozmill.isMac});
  controller.sleep(gDelay);
  controller.keypress(locationBar, "w", {});
  controller.sleep(gDelay);
          
  // Verify GO button visible and continue if TRUE
  UtilsAPI.assertElementVisible(controller, goButton, true);
 
  // Press Backspace to delete the typed character
  controller.keypress(locationBar, "VK_BACK_SPACE", {});
  controller.sleep(gDelay);
  
  // Press ESC to clear focus
  controller.keypress(locationBar, "VK_ESCAPE", {});
  controller.sleep(gDelay);   
      
  // Verify the GO button is hidden again
  UtilsAPI.assertElementVisible(controller, goButton, false);
}

/**
 * Test clicking location bar, typing a URL and clicking the GO button
 */
var testClickLocationBarAndGo = function() {
  // Start from a web page
  controller.open("http://www.mozilla.org");
  controller.waitForPageLoad();
  
  var locationBar = new elementslib.ID(controller.window.document, "urlbar");

  // Focus and type a URL into the location bar
  controller.keypress(null, "l", {metaKey: mozmill.isMac, ctrlKey: !mozmill.isMac});
  controller.sleep(gDelay);
  controller.type(locationBar, "http://www.google.com/webhp?complete=1&hl=en");
  controller.sleep(gDelay);
    
  // Click the GO button
  var goButton = new elementslib.ID(controller.window.document, "go-button");
  controller.click(goButton);
  controller.sleep(gDelay);

  // Wait for the page to load
  controller.waitForPageLoad();
  
  // Check if the Google logo exists
  controller.assertNode(new elementslib.Name(controller.tabs.activeTab, "q"));
  
  // Verify the GO button is hidden
  UtilsAPI.assertElementVisible(controller, goButton, false);
  
  // Check if the URL bar matches the expected domain name
  controller.assertValue(locationBar, "http://www.google.com/webhp?complete=1&hl=en");
}
