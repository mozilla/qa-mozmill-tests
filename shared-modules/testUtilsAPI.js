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
 *   Henrik Skupin <hskupin@mozilla.com>
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

var MODULE_NAME = 'UtilsAPI';

/**
 * Create a new URI
 */
function createURI(aSpec, aOriginCharset, aBaseURI) {
  let iosvc = Cc["@mozilla.org/network/io-service;1"].
              getService(Ci.nsIIOService);

  return iosvc.newURI(aSpec, aOriginCharset, aBaseURI);
}

/**
 * Close all tabs of the current window except the last one
 */
var closeAllTabs = function(controller) {
  while (controller.tabs.length > 1) {
    controller.click(new elementslib.Elem(controller.menus['file-menu'].menu_close));
  }

  controller.open("about:blank");
  controller.waitForPageLoad(controller.tabs.activeTab);
}

/**
 * Called to get the state of an individual property.
 *
 * @param url string URL of the string bundle
 * @param prefName string The property to get the state of.
 *
 * @returns string The value of the requested property
 */
function getProperty(url, prefName) {
  var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"].
                       getService(Components.interfaces.nsIStringBundleService);
  var bundle = sbs.createBundle(url);

  return bundle.GetStringFromName(prefName);
}

/**
 *  Run tests against a given search field
 */
function checkSearchField(controller, aElem, aTerm, aSubmit, aTimeout) {
  delayedAssertNode(controller, aElem, aTimeout);
  controller.click(aElem);
  controller.type(aElem, aTerm);

  if (aSubmit) {
    delayedAssertNode(controller, aSubmit, aTimeout);
    controller.click(aSubmit);
  }
}

/**
 * Checks the visibility of an element
 *
 * @param aController {MozmillController} Controller to work on
 * @param aNode {Element} Element to check
 * @param aVisible {bool} Expected visibility state of the element
 *
 * @throws Error Element is visible but should be hidden
 * @throws Error Element is hidden but should be visible
 */
var assertElementVisible = function(aController, aNode, aVisible) {
  // XXX: Until Mozmill tests fail when an invisible element is actioned,
  //      use the style property (bug 490548)
  var style = aController.window.getComputedStyle(aNode.getNode(), "");
  var visibility = style.getPropertyValue("visibility");

  if (aVisible) {
    if (visibility != 'visible')
      throw "Element is hidden but should be visible";
  } else {
    if (visibility == 'visible')
      throw "Element is visible but should be hidden";
  }
}

/**
 *  Waits until the specified element exists before calling assertNode
 *
 *  @param controller {MozmillController} Controller to work on
 *  @param aNode {Element} Element to check
 *  @param aTimeout {number} Timeout value in milli seconds
 */
function delayedAssertNode(controller, aNode, aTimeout) {
  controller.waitForElement(aNode, aTimeout);
  controller.assertNode(aNode);
}

/**
 *  Waits until element exists before simulating a click on it
 *
 *  @param controller {MozmillController} Controller to work on
 *  @param aNode {Element} Element to click
 *  @param aTimeout {number} Timeout value in milli seconds
 */
function delayedClick(aController, aNode, aTimeout) {
  controller.waitForElement(aNode, aTimeout);
  controller.click(aNode);
}
