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
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Tracy Walker <twalker@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *   Mark Locklear <marklocklear@gmail.com>
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

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['ToolbarAPI'];

const gTimeout = 5000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  module.locationBar =  new ToolbarAPI.locationBar(controller);
}

/**
 * Test three different ways to search in the location bar
 */
var testLocationBarSearches = function()
{
  controller.open("about:blank");
  controller.waitForPageLoad();

  /**
   * Part 1 - Check unmatched string search
   */

  var randomTestString = getRandomString(32);

  // Check if random test string is listed in the URL
  locationBar.loadURL(randomTestString);
  controller.waitForPageLoad();
  var containsString = locationBar.contains(randomTestString.toLowerCase());
  controller.assertJS("subject.randomStringInLocationBar == true",
                      {randomStringInLocationBar: containsString});
                    
  // Check for presense of Your search message containing search string
  var yourSearchString = new elementslib.XPath(controller.tabs.activeTab,
                                               "//div[@id='res']/div/p[1]/b");
  controller.assertText(yourSearchString, randomTestString.toLowerCase());

  controller.open("about:blank");
  controller.waitForPageLoad();

  /**
   * Part 2 - Check lucky match
   */

  // Check if lucky match to getpersonas.com is produced
  locationBar.loadURL("personas");
  controller.waitForPageLoad();
  controller.assertJS("subject.contains('getpersonas') == true", locationBar);

  // Check for presense of Personsas image
  var personasImage = new elementslib.XPath(controller.tabs.activeTab,
                                            "//div[@id='nav']/h1/a/img");
  controller.waitForElement(personasImage, gTimeout);

  controller.open("about:blank");
  controller.waitForPageLoad();

  /**
   * Part 3 - Check results list match
   */
  var resultsTestString = "lotr";

  // Check if search term is listed in URL
  locationBar.loadURL(resultsTestString);
  controller.waitForPageLoad();
  controller.assertJS("subject.contains('" + resultsTestString + "') == true",
                      locationBar);

  // Check for presense of search term in return results count
  // That section of the Google results page is unique from the unmtached results page
  var resultsStringCheck = new elementslib.XPath(controller.tabs.activeTab,
                                                 "//div[@id='ssb']/p/b[4]");
  controller.assertText(resultsStringCheck, resultsTestString);
}

/**
 * Creates a random set of characters
 *
 * @param {string} numCharacters
 *        length of random character set
 * @returns a random set of upper/lower case letters and digits
 * @type string
 */
function getRandomString(numCharacters) {
  var string = '';
  for(var i = 0; i < numCharacters; i++) {
    var n = Math.floor(Math.random() * 62);
    if(n < 10)
      string += n; //1-10
    else if(n < 36)
      string += String.fromCharCode(n + 55); //A-Z
    else
      string += String.fromCharCode(n + 61); //a-z
  }
  return string;
}

/**
 * Map test functions to litmus tests
 */
// testLocationBarSearches.meta = {litmusids : [8082]};
