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
 * The Initial Developer of the Original Code is Mozilla Foundation.
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

/**
 * @fileoverview
 * The UtilsAPI offers various helper functions for any other API which is
 * not already covered by another shared module.
 *
 * @version 1.0.3
 */

var MODULE_NAME = 'UtilsAPI';

/**
 * Create a new URI
 *
 * @param {string} spec
 *        The URI string in UTF-8 encoding.
 * @param {string} originCharset
 *        The charset of the document from which this URI string originated.
 * @param {string} baseURI
 *        If null, spec must specify an absolute URI. Otherwise, spec may be
 *        resolved relative to baseURI, depending on the protocol.
 * @return A URI object
 * @type nsIURI
 */
function createURI(spec, originCharset, baseURI)
{
  let iosvc = Cc["@mozilla.org/network/io-service;1"].
              getService(Ci.nsIIOService);

  return iosvc.newURI(spec, originCharset, baseURI);
}

/**
 * Close all tabs of the controllers window except the last one and open a blank
 * page.
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var closeAllTabs = function(controller)
{
  while (controller.tabs.length > 1) {
    controller.click(new elementslib.Elem(controller.menus['file-menu'].menu_close));
  }

  controller.open("about:blank");
  controller.waitForPageLoad();
}

/**
 * Called to get the value of an individual property.
 *
 * @param {string} url
 *        URL of the string bundle.
 * @param {string} prefName
 *        The property to get the value of.
 *
 * @return The value of the requested property
 * @type string
 */
function getProperty(url, prefName)
{
  var sbs = Components.classes["@mozilla.org/intl/stringbundle;1"].
                       getService(Components.interfaces.nsIStringBundleService);
  var bundle = sbs.createBundle(url);

  return bundle.GetStringFromName(prefName);
}

/**
 * Run tests against a given search form
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 * @param {ElemBase} searchField
 *        The HTML input form element to test
 * @param {string} searchTerm
 *        The search term for the test
 * @param {ElemBase} submitButton
 *        (Optional) The forms submit button
 * @param {number} timeout
 *        The timeout value for the single tests
 */
function checkSearchField(controller, searchField, searchTerm, submitButton, timeout)
{
  controller.waitThenClick(searchField, timeout);
  controller.type(searchField, searchTerm);

  if (submitButton != undefined) {
    controller.waitThenClick(submitButton, timeout);
  }
}

/**
 * Checks the visibility of an element.
 * XXX: Mozmill doesn't check if an element is visible and also operates on
 * elements which are invisible. (Bug 490548)
 *
 * @param {MozmillController} controller
 *        MozMillController of the window to operate on
 * @param {ElemBase} element
 *        Element to check its visibility
 * @param {boolean} visibility
 *        Expected visibility state of the element
 * @throws Error Element is visible but should be hidden
 * @throws Error Element is hidden but should be visible
 */
function assertElementVisible(controller, element, visibility)
{
  var style = controller.window.getComputedStyle(element.getNode(), "");
  var state = style.getPropertyValue("visibility");

  if (visibility) {
    if (state != 'visible')
      throw "Element is hidden but should be visible";
  } else {
    if (state == 'visible')
      throw "Element is visible but should be hidden";
  }
}

/**
 * Creates the child element of the tab's notification bar
 *
 * @param {MozMillController} controller
 *        Controller of the window to operate on
 * @param {string} elemString
 *        (Optional) Lookup string of the notification bar's child element
 * @param {number} tabIndex
 *        (Optional) Index of the tab to check
 * @return The created child element
 * @type ElemBase
 */
function createNotificationBarElement(controller, elemString, tabIndex)
{
  const containerString = '/id("main-window")/id("browser")/id("appcontent")/id("content")/anon({"anonid":"tabbox"})/anon({"anonid":"panelcontainer"})';

  var index = tabIndex ? tabIndex : controller.tabs.activeTabIndex;
  var elemStr = elemString ? elemString : "";

  // Get the panel so we can fetch the panel id
  var container = new elementslib.Lookup(controller.window.document, containerString);
  controller.waitForElement(container, 500);

  var expression = containerString + '/{"id":"' + container.getNode().childNodes[index].id + '"}' + elemStr;
  return new elementslib.Lookup(controller.window.document, expression);
}
