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
 * Litmus test #7958: Top Site - Yahoo
 */

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['UtilsAPI'];

const gTimeout = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

var testYahoo = function () {
  var url = 'http://us.yahoo.com/';
  var searchTerm = "Mozilla";

  // Open the web page.
  controller.open(url);
  controller.waitForPageLoad();

  // Check for the Yahoo logo
  var yahooLogo = new elementslib.ID(controller.tabs.activeTab, 'ylogo');
  controller.waitForElement(yahooLogo, gTimeout);

  // Check the location bar has the correct URL
  var locationBar = new elementslib.ID(controller.window.document, 'urlbar');
  controller.assertValue(locationBar, url);

  // Check existance of More Yahoo! Services button
  var servicesButton = new elementslib.ID(controller.tabs.activeTab, "allyservices")
  controller.waitForElement(servicesButton, gTimeout);

  // Check search field
  var searchField = new elementslib.ID(controller.tabs.activeTab, 'p');
  var searchSubmit = new elementslib.ID(controller.tabs.activeTab, "searchsubmit");
  UtilsAPI.checkSearchField(controller, searchField, searchTerm, searchSubmit);
  controller.waitForPageLoad();

  // Check if the correct search was performed
  var resultSearchField = new elementslib.ID(controller.tabs.activeTab, "yschsp");
  controller.assertValue(resultSearchField, searchTerm);
}
