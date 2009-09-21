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
 * Litmus test #6040: Location Bar Search
 */
const gTimeout = 5000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();

  locationBar = new elementslib.ID(controller.window.document, 'urlbar');
}

/**
 * There are three parts to this test as follows
 */
var testLocationBarSearches = function () {

  /**
   * Part 1 - Check unmatched string search
   */
  var randomTestString = "oau45rtdgsh34nf";

  // Open a blank page to ensure test page is not already loaded
  controller.open("about:blank");
  controller.waitForPageLoad();

  // Enter test string into Awesome Bar
  controller.open(randomTestString);
  controller.waitForPageLoad();

  // Check if search term is listed in URL
  controller.assertJS(locationBar.getNode().value.indexOf(randomTestString) !== -1);

  // Check for presense of Your search message containing search string
  var yourSearchString = new elementslib.XPath(controller.tabs.activeTab, "/html/body[@id='gsr']/div[@id='cnt']/div[@id='res']/div/p[1]/b");
  controller.assertText(yourSearchString, randomTestString);

  /**
   * Part 2 - Check lucky match
   */

  // Open a blank page to ensure test page is not already loaded
  controller.open("about:blank");
  controller.waitForPageLoad();

  // Enter test string into Awesome Bar
  controller.open("personas");
  controller.waitForPageLoad();

  // Check if lucky match to getpersonas.org is produced
  controller.assertJS(locationBar.getNode().value.indexOf("getpersonas") !== -1);

  // Check for presense of Personsas image
  var personasImage = new elementslib.XPath(controller.tabs.activeTab, "/html/body/div[@id='outer-wrapper']/div[@id='inner-wrapper']/div[@id='nav']/h1/a/img");
  controller.waitForElement(personasImage, gTimeout);

  /**
   * Part 3 - Check results list match
   */
  var resultsTestString = "lotr";

  // Open a blank page to ensure test page is not already loaded
  controller.open("about:blank");
  controller.waitForPageLoad();

  // Enter the test string into Awesome Bar
  controller.open(resultsTestString);
  controller.waitForPageLoad();

  // Check if search term is listed in URL
  controller.assertJS(locationBar.getNode().value.indexOf(resultsTestString) !== -1);

  // Check for presense of search term in return results count
  // That section of the Google results page is unique from the unmtached results page
  var resultsStringCheck = new elementslib.XPath(controller.tabs.activeTab, "/html/body[@id='gsr']/div[@id='cnt']/div[@id='ssb']/p/b[4]");
  controller.assertText(resultsStringCheck, resultsTestString);
}
