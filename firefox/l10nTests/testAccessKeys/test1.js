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
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Adrian Kalla <akalla@aviary.pl>
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
 * This test tests the Preferences window and its sub-windows for duplicated
 * access keys.
 */

// Include the required modules
var domUtils = require("../../../shared-modules/dom-utils");
var localization = require("../../../shared-modules/localization");
var prefs = require("../../../shared-modules/prefs");
var utils = require("../../../shared-modules/utils");

const GET_BY_ID = domUtils.DOMWalker.GET_BY_ID;
const GET_BY_SELECTOR = domUtils.DOMWalker.GET_BY_SELECTOR;
const WINDOW_CURRENT = domUtils.DOMWalker.WINDOW_CURRENT;
const WINDOW_MODAL= domUtils.DOMWalker.WINDOW_MODAL;
const WINDOW_NEW = domUtils.DOMWalker.WINDOW_NEW;

function setupModule(module) {
  controller = mozmill.getBrowserController();
}

function prefPaneInit(controller, prefDialog) {
  var dtds = ["chrome://passwordmgr/locale/passwordManager.dtd",
              "chrome://browser/locale/preferences/content.dtd",
              "chrome://browser/locale/preferences/cookies.dtd",
              "chrome://pippki/locale/certManager.dtd",
              "chrome://pippki/locale/deviceManager.dtd",
              "chrome://pippki/locale/validation.dtd"];
  var properties = ["chrome://browser/locale/preferences/preferences.properties"];

  var ids = [
    { getBy : GET_BY_ID,
      id : "paneMain",
      target : WINDOW_CURRENT,
      windowHandler : prefDialog,
      subContent : [
        { getBy : GET_BY_ID,
          id : "useBookmark",
          target : WINDOW_MODAL}
      ]},
    { getBy : GET_BY_ID,
      id : "paneTabs",
      target : WINDOW_CURRENT,
      windowHandler : prefDialog},
    { getBy : GET_BY_ID,
      id : "paneContent",
      target : WINDOW_CURRENT, windowHandler :
      prefDialog, subContent : [
        { getBy : GET_BY_ID,
          id : "popupPolicyButton",
          target : WINDOW_NEW,
          title : utils.getProperty(properties, "popuppermissionstitle")},
        { getBy : GET_BY_SELECTOR,
          selector : "button[accesskey="+utils.getEntity(dtds, "exceptions.accesskey")+
                     "][label="+utils.getEntity(dtds, "exceptions.label")+"]",
          target : WINDOW_NEW,
          title : utils.getProperty(properties, "imagepermissionstitle")},
        { getBy : GET_BY_ID,
          id : "advancedJSButton",
          target : WINDOW_MODAL},
        { getBy : GET_BY_ID,
          id : "advancedFonts",
          target : WINDOW_MODAL},
        { getBy : GET_BY_ID,
          id : "colors",
          target : WINDOW_MODAL},
        { getBy : GET_BY_ID,
          id : "chooseLanguage",
          target : WINDOW_MODAL}
      ]},
    { getBy : GET_BY_ID,
      id : "paneApplications",
      target : WINDOW_CURRENT,
      windowHandler : prefDialog},
    { getBy : GET_BY_ID,
      id : "panePrivacy",
      target : WINDOW_CURRENT,
      windowHandler : prefDialog,
      subContent : [
        { getBy : GET_BY_ID,
          id : "historyMode",
          target : WINDOW_CURRENT,
          value : "remember"},
        { getBy : GET_BY_ID,
          id : "historyMode",
          target : WINDOW_CURRENT,
          value : "dontremember"},
        { getBy : GET_BY_ID,
          id : "historyMode",
          target : WINDOW_CURRENT,
          value : "custom",
          subContent : [
            { getBy : GET_BY_ID,
              id : "privateBrowsingAutoStart",
              target : WINDOW_CURRENT},
            { getBy : GET_BY_ID,
              id : "cookieExceptions",
              target : WINDOW_NEW,
              title : utils.getProperty(properties, "cookiepermissionstitle")},
            { getBy : GET_BY_ID,
              id : "showCookiesButton",
              target : WINDOW_NEW,
              title : utils.getEntity(dtds, "window.title")}
          ]
        }
      ]},
    { getBy : GET_BY_ID,
      id : "paneSecurity",
      target : WINDOW_CURRENT,
      windowHandler : prefDialog,
      subContent : [
        { getBy : GET_BY_ID,
          id : "addonExceptions",
          target : WINDOW_NEW,
          title : utils.getProperty(properties, "addons_permissions_title")},
        { getBy : GET_BY_ID,
          id : "passwordExceptions",
          target : WINDOW_NEW,
          title : utils.getEntity(dtds, "savedPasswordsExceptions.title")},
        { getBy : GET_BY_ID,
          id : "useMasterPassword",
          target : WINDOW_MODAL},
        { getBy : GET_BY_ID,
          id : "showPasswords",
          target : WINDOW_NEW,
          title : utils.getEntity(dtds, "savedPasswords.title")}
      ]},
    { getBy : GET_BY_ID,
      id : "paneAdvanced",
      target : WINDOW_CURRENT,
      windowHandler : prefDialog,
      subContent : [
        { getBy : GET_BY_ID,
          id : "generalTab",
          target : WINDOW_CURRENT,
          windowHandler : prefDialog},
        { getBy : GET_BY_ID,
          id : "networkTab",
          target : WINDOW_CURRENT,
          windowHandler : prefDialog,
          subContent : [
            { getBy : GET_BY_ID,
              id : "connectionSettings",
              target : WINDOW_MODAL},
            { getBy : GET_BY_ID,
              id : "offlineNotifyExceptions",
              target : WINDOW_NEW,
              title : utils.getProperty(properties, "offlinepermissionstitle")}
          ]},
        { getBy : GET_BY_ID,
          id : "updateTab",
          target : WINDOW_CURRENT,
          windowHandler : prefDialog,
          subContent : [
            { getBy : GET_BY_ID,
              id : "showUpdateHistory",
              target : WINDOW_MODAL}
          ]},
        { getBy : GET_BY_ID,
          id : "encryptionTab",
          target : WINDOW_CURRENT,
          windowHandler : prefDialog,
          subContent : [
            { getBy : GET_BY_ID,
              id : "viewCertificatesButton",
              target : WINDOW_NEW,
              title : utils.getEntity(dtds, "certmgr.title")},
            { getBy : GET_BY_ID,
              id : "viewCRLButton",
              target : WINDOW_NEW,
              title : utils.getEntity(dtds, "validation.crlmanager.label")},
            { getBy : GET_BY_ID,
              id : "viewSecurityDevicesButton",
              target : WINDOW_NEW,
              title : utils.getEntity(dtds, "devmgr.title")},
            { getBy : GET_BY_ID,
              id : "verificationButton",
              target : WINDOW_MODAL}
          ]},
      ]},
    { getBy : GET_BY_ID,
      id : "paneSync",
      target : WINDOW_CURRENT,
      windowHandler : prefDialog}
  ];

  return ids;
}

function prefPanesAccessKeyTest(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);

  var ids = prefPaneInit(controller, prefDialog);

  var domWalker = new domUtils.DOMWalker(controller,
                                         localization.filterAccessKeys,
                                         localization.prepareAccessKey,
                                         localization.checkAccessKeysResults);

  domWalker.walk(ids);

  prefDialog.close();
}

function testPrefWindowAccessKeys() {
  prefs.openPreferencesDialog(controller, prefPanesAccessKeyTest);
}
