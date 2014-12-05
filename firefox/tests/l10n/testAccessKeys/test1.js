/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * This test tests the Preferences window and its sub-windows for duplicated
 * access keys.
 */

"use strict";

// Include the required modules
var domUtils = require("../../../../lib/dom-utils");
var localization = require("../../../../lib/localization");
var prefs = require("../../../../lib/prefs");

var prefWindow = require("../../../lib/ui/pref-window");

const GET_BY_ID = domUtils.DOMWalker.GET_BY_ID;
const GET_BY_SELECTOR = domUtils.DOMWalker.GET_BY_SELECTOR;
const WINDOW_CURRENT = domUtils.DOMWalker.WINDOW_CURRENT;
const WINDOW_MODAL= domUtils.DOMWalker.WINDOW_MODAL;
const WINDOW_NEW = domUtils.DOMWalker.WINDOW_NEW;

const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  prefs.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);
  aModule.controller.stopApplication(true);
}

function prefPaneInit(aController, aPrefDialog) {
  var ids = [
    { getBy : GET_BY_ID,
      id : "paneMain",
      target : WINDOW_CURRENT,
      windowHandler : aPrefDialog,
      subContent : [
        { getBy : GET_BY_ID,
          id : "useBookmark",
          target : WINDOW_MODAL}
      ]},
    { getBy : GET_BY_ID,
      id : "paneTabs",
      target : WINDOW_CURRENT,
      windowHandler : aPrefDialog},
    { getBy : GET_BY_ID,
      id : "paneContent",
      target : WINDOW_CURRENT, windowHandler :
      aPrefDialog, subContent : [
        { getBy : GET_BY_ID,
          id : "popupPolicyButton",
          target : WINDOW_NEW,
          type : "Browser:Permissions"},
        { getBy : GET_BY_SELECTOR,
          selector : "#enableImagesRow button",
          target : WINDOW_NEW,
          type : "Browser:Permissions"},
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
      windowHandler : aPrefDialog},
    { getBy : GET_BY_ID,
      id : "panePrivacy",
      target : WINDOW_CURRENT,
      windowHandler : aPrefDialog,
      subContent : [
        { getBy : GET_BY_ID,
          id : "historyMode",
          target : WINDOW_CURRENT,
          preHook : disableResetDialogCall,
          postHook : restoreResetDialogCall,
          value : "remember"},
        { getBy : GET_BY_ID,
          id : "historyMode",
          target : WINDOW_CURRENT,
          preHook : disableResetDialogCall,
          postHook : restoreResetDialogCall,
          value : "dontremember"},
        { getBy : GET_BY_ID,
          id : "historyMode",
          target : WINDOW_CURRENT,
          preHook : disableResetDialogCall,
          postHook : restoreResetDialogCall,
          value : "custom",
          subContent : [
            { getBy : GET_BY_ID,
              id : "privateBrowsingAutoStart",
              preHook : disablePrivateBrowsingAutoStartPreference,
              postHook : restorePrivateBrowsingAutoStartPreference,
              target : WINDOW_CURRENT},
            { getBy : GET_BY_ID,
              id : "cookieExceptions",
              target : WINDOW_NEW,
              type : "Browser:Permissions"},
            { getBy : GET_BY_ID,
              id : "showCookiesButton",
              target : WINDOW_NEW,
              type : "Browser:Cookies"}
          ]
        }
      ]},
    { getBy : GET_BY_ID,
      id : "paneSecurity",
      target : WINDOW_CURRENT,
      windowHandler : aPrefDialog,
      subContent : [
        { getBy : GET_BY_ID,
          id : "addonExceptions",
          target : WINDOW_NEW,
          type : "Browser:Permissions"},
        { getBy : GET_BY_ID,
          id : "passwordExceptions",
          target : WINDOW_NEW,
          type : "Toolkit:PasswordManagerExceptions"},
        { getBy : GET_BY_ID,
          id : "useMasterPassword",
          target : WINDOW_MODAL},
        { getBy : GET_BY_ID,
          id : "showPasswords",
          target : WINDOW_NEW,
          type : "Toolkit:PasswordManager"}
      ]},
    { getBy : GET_BY_ID,
      id : "paneSync",
      target : WINDOW_CURRENT,
      windowHandler : aPrefDialog},
    { getBy : GET_BY_ID,
      id : "paneAdvanced",
      target : WINDOW_CURRENT,
      windowHandler : aPrefDialog,
      subContent : [
        { getBy : GET_BY_ID,
          id : "generalTab",
          target : WINDOW_CURRENT,
          windowHandler : aPrefDialog},
        { getBy : GET_BY_ID,
          id : "networkTab",
          target : WINDOW_CURRENT,
          windowHandler : aPrefDialog,
          subContent : [
            { getBy : GET_BY_ID,
              id : "connectionSettings",
              target : WINDOW_MODAL},
            { getBy : GET_BY_ID,
              id : "offlineNotifyExceptions",
              target : WINDOW_NEW,
              type : "Browser:Permissions"}
          ]},
        { getBy : GET_BY_ID,
          id : "updateTab",
          target : WINDOW_CURRENT,
          windowHandler : aPrefDialog,
          subContent : [
            { getBy : GET_BY_ID,
              id : "showUpdateHistory",
              target : WINDOW_MODAL}
          ]},
        { getBy : GET_BY_ID,
          id : "encryptionTab",
          target : WINDOW_CURRENT,
          windowHandler : aPrefDialog,
          subContent : [
            { getBy : GET_BY_ID,
              id : "viewCertificatesButton",
              target : WINDOW_NEW,
              type : "mozilla:certmanager"},
            { getBy : GET_BY_ID,
              id : "viewCRLButton",
              target : WINDOW_NEW,
              type : "mozilla:crlmanager"},
            { getBy : GET_BY_ID,
              id : "verificationButton",
              target : WINDOW_MODAL},
            { getBy : GET_BY_ID,
              id : "viewSecurityDevicesButton",
              target : WINDOW_NEW,
              type : "mozilla:devicemanager"}
          ]},
      ]}
  ];

  return ids;
}

function prefPanesAccessKeyTest(aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);

  var ids = prefPaneInit(aController, prefDialog);

  var domWalker = new domUtils.DOMWalker(controller,
                                         localization.filterAccessKeys,
                                         localization.prepareAccessKey,
                                         localization.checkAccessKeysResults);

  domWalker.walk(ids);

  prefDialog.close();
}

function testPrefWindowAccessKeys() {
  prefWindow.openPreferencesDialog(controller, prefPanesAccessKeyTest);
}

/**
 * Disables the Reset Dialog by overwriting the oncommand attribute
 * and saving the original value in a temporary location
 */
function disableResetDialogCall() {
  var aCommand = this.getAttribute("oncommand");
  this.setAttribute("data-command-backup", aCommand);
  this.setAttribute("oncommand", "gPrivacyPane.updateHistoryModePane(); \
                                  gPrivacyPane.updateHistoryModePrefs(); \
                                  gPrivacyPane.updatePrivacyMicroControls();");
}

/**
 * Restore the oncommand attribute from the temporary location
 */
function restoreResetDialogCall() {
  var aCommand = this.getAttribute("data-command-backup");
  this.setAttribute("oncommand", aCommand);
  this.removeAttribute("data-command-backup");
}

/**
 * Disables the Reset Dialog by overwriting the oncommand attribute
 * and saving the original value in a temporary location
 */
function disablePrivateBrowsingAutoStartPreference() {
  var aCommand = this.getAttribute("oncommand");
  this.setAttribute("data-command-backup", aCommand);
  this.removeAttribute("oncommand");
}

/**
 * Restore the preference attribute
 */
function restorePrivateBrowsingAutoStartPreference() {
  var aCommand = this.getAttribute("data-command-backup");
  this.setAttribute("oncommand", aCommand);
  this.removeAttribute("data-command-backup");
}
