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
 * The Original Code is Mozilla Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is Mozilla Corporation.
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

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

/**
 *  Testcase ID #6041 - Test XMLHttpRequest to provide suggested search terms
 */
var testGoogleSuggestedTerms = function() {
  // Open the Google Webpage
  controller.open("http://www.google.com/webhp?complete=1&hl=en");
  controller.waitForPageLoad();

  // Activate the search bar and input in a search parameter
  controller.type(new elementslib.Name(controller.tabs.activeTab, "q"), "area");
  controller.waitForElement(new elementslib.XPath(controller.tabs.activeTab, "/html/body/center/form/table[2]/tbody/tr[1]/td[1]"));

  // Click the first element in the pop-down autocomplete and start the search
  controller.click(new elementslib.XPath(controller.tabs.activeTab, "/html/body/center/form/table[2]/tbody/tr[1]/td[1]"));
  controller.click(new elementslib.Name(controller.tabs.activeTab, "btnG"));
  controller.waitForPageLoad();

  // Check if Search page has come up
  controller.waitForElement(new elementslib.Name(controller.tabs.activeTab, "q"));
  controller.waitForElement(new elementslib.Link(controller.tabs.activeTab, "Next"));
}
