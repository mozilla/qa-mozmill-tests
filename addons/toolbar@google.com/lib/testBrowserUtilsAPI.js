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
 * The Original Code is Google toolbar mozmill test suite.
 *
 * The Initial Developer of the Original Code is Google.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Ankush Kalkote <ankush@google.com>
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
 * @fileoverview This file contains utils function related to browser.
 * This is NOT a test file.
 *
 * @author ankush@google.com (Ankush Kalkote)
 */
const MODULE_NAME = 'BrowserUtilsAPI';

/**
 * Gets title of the browser window
 * @param {MozMillController} controller Mozmill controller of FF-window.
 * @return {string} title of the browser window.
 */
function getTitle(controller) {
  return controller.window.document.title;
}

/**
 * Gets title of the content document opened in the window
 * @param {MozMillController} controller Mozmill controller of FF-window.
 * @return {string} title of the content document.
 */
function getContentTitle(controller) {
  return controller.window.content.document.title;
}

/**
 * Gets url from url-bar.
 * @param {MozMillController} controller Mozmill controller of FF-window.
 * @return {string} URL from browser urlbar.
 */
function getUrl(controller) {
  var locationBar = new elementslib.ID(controller.window.document, 'urlbar');
  return locationBar.getNode().value;
}

/**
 * Gives Firefox Language (locale).
 * @param {MozMillController} controller Mozmill controller of FF-window.
 * @return {string} FF-language.
 */
function getNavigatorLanguage(controller) {
  return controller.window.navigator.language;
}

/**
 * Returns the default nsIPrefBranch.
 * @return {nsIPrefBranch} default preferences branch.
 */
function getDefaultPrefsBranch() {
  var prefs = Components.classes['@mozilla.org/preferences-service;1']
                        .getService(Components.interfaces.nsIPrefBranch);
  return prefs.getDefaultBranch()
}

/**
 * Returns the Google Toolbar prefs branch.
 * @return {nsIPrefBranch} default preferences branch.
 */
function getToolbarPrefsBranch() {
  var prefs = Components.classes['@mozilla.org/preferences-service;1']
                    .getService(Components.interfaces.nsIPrefService);
  return prefs.getBranch('google.toolbar.');
}

/**
 * Types the given URL in the address bar using keypress and presses enter.
 * @param {MozMillController} controller Mozmill controller for FF window
 * @param {string} url URL to be opened
 */
function openURL(controller, url) {
  var addressBar = controller.window.document.getElementById('urlbar');
  var addressBarElem = new elementslib.Elem(addressBar);
  addressBar.textValue = '';
  controller.type(addressBarElem, url);
  controller.keypress(addressBarElem, 'VK_RETURN',{});
};
