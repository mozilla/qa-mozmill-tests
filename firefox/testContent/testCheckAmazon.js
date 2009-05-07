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
 *   Henrik Skupin <hskupin@gmail.com>
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

var mozmill = {}; Components.utils.import('resource://mozmill/modules/mozmill.js', mozmill);
var elementslib = {}; Components.utils.import('resource://mozmill/modules/elementslib.js', elementslib);

// Include necessary modules
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['UtilsAPI'];

// Global timeout value
const gTimeout = 10000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();

  module.utils = collector.getModule('UtilsAPI');
}

var teardownModule = function(module) {
  // Remove all cookies which were set by Amazon.com
  var cm = Components.classes["@mozilla.org/cookiemanager;1"].
                      getService(Components.interfaces.nsICookieManager);
  cm.removeAll();
}

/**
 *  Testcase ID #5917 - Top Site - Amazon.com
 */
var testCheckAmazonCom = function () {
  controller.open("http://www.amazon.com");
  controller.waitForPageLoad(controller.tabs.activeTab, gTimeout);

  // Check sign-in link
  let signIn = new elementslib.Link(controller.tabs.activeTab, "personalized recommendations");
  utils.delayedAssertNode(controller, signIn, gTimeout);

  // Check your account link
  let account = new elementslib.Link(controller.tabs.activeTab, "Your Account");
  utils.delayedAssertNode(controller, account, gTimeout);

  // Select category 'Music'
  let category = new elementslib.Name(controller.tabs.activeTab, "url");
  utils.delayedAssertNode(controller, category, gTimeout);
  controller.select(category, null, "Music", null);

  // Check search field
  let searchField = new elementslib.ID(controller.tabs.activeTab, "twotabsearchtextbox");
  let searchSubmit = new elementslib.XPath(controller.tabs.activeTab, "//div[@id='navGoButton']/input");
  utils.checkSearchField(controller, searchField, "The Police", searchSubmit);
  controller.waitForPageLoad(controller.tabs.activeTab, gTimeout);

  // Click on image of the first search result
  let item = new elementslib.XPath(controller.tabs.activeTab, "//div[@id='result_0']/div[2]/a/img");
  utils.delayedAssertNode(controller, item, gTimeout);
  controller.click(item);
  controller.waitForPageLoad(controller.tabs.activeTab, gTimeout);

  // Add item to cart
  let addButton = new elementslib.Name(controller.tabs.activeTab, "submit.add-to-cart");
  utils.delayedAssertNode(controller, addButton, gTimeout);
  controller.click(addButton);
  controller.waitForPageLoad(controller.tabs.activeTab, gTimeout);

  // Open cart
  let cart = new elementslib.Link(controller.tabs.activeTab, "Cart");
  controller.click(cart);
  controller.waitForPageLoad(controller.tabs.activeTab, gTimeout);

  // Check if the item was added
  let quantity = new elementslib.Name(controller.tabs.activeTab, "quantity.1");
  utils.delayedAssertNode(controller, quantity, gTimeout);
  controller.assertValue(quantity, "1");
}
