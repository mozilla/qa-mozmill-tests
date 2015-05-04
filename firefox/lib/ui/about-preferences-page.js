/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

var weaveService = Cc["@mozilla.org/weave/service;1"]
                   .getService(Components.interfaces.nsISupports)
                   .wrappedJSObject;

// Include required modules
var domUtils = require("../../../lib/dom-utils");
var utils = require("../../../lib/utils");

var baseInContentPage = require("base-in-content-page");

const CATEGORIES = {
  general: "paneGeneral",
  search: "paneSearch",
  content: "paneContent",
  application: "paneApplications",
  privacy: "panePrivacy",
  security: "paneSecurity",
  sync: "paneSync",
  advanced: "paneAdvanced"
};

/**
 * 'About Preferences' in content page class
 * @constructor
 *
 * @param {object} aBrowserWindow
 *        Browser window where the page lives
 */
function AboutPreferencesPage(aBrowserWindow) {
  baseInContentPage.BaseInContentPage.call(this, aBrowserWindow);

  this._dtds = ["chrome://branding/locale/brand.dtd",
                "chrome://browser/locale/preferences/preferences.dtd",
                "chrome://browser/locale/baseMenuOverlay.dtd"];
}

AboutPreferencesPage.prototype = Object.create(baseInContentPage.BaseInContentPage.prototype);
AboutPreferencesPage.prototype.constructor = AboutPreferencesPage;

/**
 * Retrieve the currently selected category
 *
 * @returns {ElemBase} The panel category element
 */
AboutPreferencesPage.prototype.__defineGetter__('category', function () {
  return this.getElement({type: "category_selected"});
});

/**
 * Select another category from the preferences page
 *
 * @param {string} aCategory
 *        The category to switch to
 */
AboutPreferencesPage.prototype.__defineSetter__('category', function (aCategory) {
  assert.ok(CATEGORIES[aCategory], "Specified category exists");

  var categoryButton = this.getElement({type: "category_item",
                                        subtype: aCategory});
  categoryButton.click();

  assert.waitFor(() => this.isSelected(aCategory),
                 "Category has been loaded - " + aCategory);

  // For "sync" category wait for weave:service to be ready
  if (aCategory === "sync") {
    assert.waitFor(() => weaveService.ready,
                   "'weave:service' is ready.");
  }
});

/**
 *  Check if a specific category is selected
 *
 * @param {string} aCategory
 *        The category to check if it is selected
 *
 * @returns {boolean} True if the category is selected
 */
AboutPreferencesPage.prototype.isSelected = function APP_isSelected(aCategory) {
  return this.category.getNode().getAttribute("id") == "category-" + aCategory;
};

/**
 * Retrieve list of UI elements based on the given specification
 *
 * @param {object} aSpec
 *        Information of the UI elements which should be retrieved
 * @parma {string} aSpec.type
 *        Identifier of the element
 * @param {string} aSpec.subtype
 *        Attribute of the element to filter
 * @param {string} [aSpec.parent=document]
 *        Parent of the element to find
 *
 * @returns {ElemBase[]} Elements which have been found
 */
AboutPreferencesPage.prototype.getElements = function (aSpec) {
  var spec = aSpec || { };

  var elems = [];
  var root = spec.parent ? spec.parent.getNode() : this.contentWindow.document;
  var nodeCollector = new domUtils.nodeCollector(root);

  switch (spec.type) {
    case "advanced_allowHardwareAcceleration":
      elems = [findElement.ID(root, "allowHWAccel")];
      break;
    case "advanced_allowSmartSize":
      elems = [findElement.ID(root, "allowSmartSize")];
      break;
    case "advanced_blockAutoRefresh":
      elems = [findElement.ID(root, "blockAutoRefresh")];
      break;
    case "advanced_cacheSizeValue":
      elems = [findElement.ID(root, "cacheSize")];
      break;
    case "advanced_certSelection":
      elems = [findElement.ID(root, "certSelection")];
      break;
    case "advanced_checkSpelling":
      elems = [findElement.ID(root, "checkSpelling")];
      break;
    case "advanced_clearCache":
      elems = [findElement.ID(root, "clearCacheButton")];
      break;
    case "advanced_clearOfflineAppCache":
      elems = [findElement.ID(root, "clearOfflineAppCacheButton")];
      break;
    case "advanced_connectionSettings":
      elems = [findElement.ID(root, "connectionSettings")];
      break;
    case "advanced_dataChoicesTab":
      elems = [findElement.ID(root, "dataChoicesTab")];
      break;
    case "advanced_enableOCSP":
      elems = [findElement.ID(root, "enableOCSP")];
      break;
    case "advanced_encryptionTab":
      elems = [findElement.ID(root, "encryptionTab")];
      break;
    case "advanced_generalTab":
      elems = [findElement.ID(root, "generalTab")];
      break;
    case "advanced_networkTab":
      elems = [findElement.ID(root, "networkTab")];
      break;
    case "advanced_offlineAppsList":
      elems = [findElement.ID(root, "offlineAppsList")];
      break;
    case "advanced_offlineAppsListRemove":
      elems = [findElement.ID(root, "offlineAppsListRemove")];
      break;
    case "advanced_offlineNotify":
      elems = [findElement.ID(root, "offlineNotify")];
      break;
    case "advanced_offlineNotifyExceptions":
      elems = [findElement.ID(root, "offlineNotifyExceptions")];
      break;
    case "advanced_searchEnginesUpdate":
      elems = [findElement.ID(root, "enableSearchUpdate")];
      break;
    case "advanced_searchStartTyping":
      elems = [findElement.ID(root, "searchStartTyping")];
      break;
    case "advanced_showUpdateHistory":
      elems = [findElement.ID(root, "showUpdateHistory")];
      break;
    case "advanced_submitCrashesBox":
      elems = [findElement.ID(root, "submitCrashesBox")];
      break;
    case "advanced_submitHealthReportBox":
      elems = [findElement.ID(root, "submitHealthReportBox")];
      break;
    case "advanced_submitTelemetryBox":
      elems = [findElement.ID(root, "submitTelemetryBox")];
      break;
    case "advanced_updateAutoInstall":
      elems = [findElement.ID(root, "autoDesktop")];
      break;
    case "advanced_updateRadioGroup":
      elems = [findElement.ID(root, "updateRadioGroup")];
      break;
    case "advanced_updateTab":
      elems = [findElement.ID(root, "updateTab")];
      break;
    case "advanced_useAutoScroll":
      elems = [findElement.ID(root, "useAutoScroll")];
      break;
    case "advanced_useCursorNavigation":
      elems = [findElement.ID(root, "useCursorNavigation")];
      break;
    case "advanced_useSmoothScrolling":
      elems = [findElement.ID(root, "useSmoothScrolling")];
      break;
    case "advanced_viewCertificates":
      elems = [findElement.ID(root, "viewCertificatesButton")];
      break;
    case "advanced_viewSecurityDevices":
      elems = [findElement.ID(root, "viewSecurityDevicesButton")];
      break;
    case "advanced_warnIncompatibleAddons":
      elems = [findElement.ID(root, "warnIncompatible")];
      break;
    case "application_applicationsHandlersList":
      elems = [findElement.ID(root, "handlersView")];
      break;
    case "application_applicationsHandler":
      nodeCollector.root = this.getElement({type: "application_applicationsHandlersList"});
      nodeCollector.queryNodes("richlistitem")
                   .filterByDOMProperty(aSpec.subtype, aSpec.value);
      elems = nodeCollector.elements;
      break;
    case "application_filter":
      elems = [findElement.ID(root, "filter")];
      break;
    case "category_item":
      assert.ok(spec.subtype, "Category has been specified");
      elems = [findElement.ID(root, "category-" + spec.subtype)];
      break;
    case "category_menu_wrapper":
      elems = [findElement.ID(root, "categories")];
      break;
    case "category_selected":
      elems = [findElement.Selector(root, ".category[selected=true][current=true]")];
      break;
    case "content_chooseLanguage":
      elems = [findElement.ID(root, "chooseLanguage")];
      break;
    case "content_font":
      elems = [findElement.ID(root, "defaultFont")];
      break;
    case "content_fontAdvanced":
      elems = [findElement.ID(root, "advancedFonts")];
      break;
    case "content_fontSize":
      elems = [findElement.ID(root, "defaultFontSize")];
      break;
    case "content_fontsColors":
      elems = [findElement.ID(root, "colors")];
      break;
    case "content_popupPolicy":
      elems = [findElement.ID(root, "popupPolicy")];
      break;
    case "content_popupPolicyExceptions":
      elems = [findElement.ID(root, "popupPolicyButton")];
      break;
    case "general_alwaysCheckDefault":
      elems = [findElement.ID(root, "alwaysCheckDefault")];
      break;
    case "general_browserStartupPage":
      elems = [findElement.ID(root, "browserStartupPage")];
      break;
    case "general_downloadFolder":
      elems = [findElement.ID(root, "downloadFolder")];
      break;
    case "general_downloadsAlwaysAsk":
      elems = [findElement.ID(root, "alwaysAsk")];
      break;
    case "general_downloadsSaveTo":
      elems = [findElement.ID(root, "saveToRow")];
      break;
    case "general_downloadsSaveWhere":
      elems = [findElement.ID(root, "saveWhere")];
      break;
    case "general_enable_e10s":
      elems = [findElement.ID(root, "e10sAutoStart")];
      break;
    case "general_homePage":
      elems = [findElement.ID(root, "browserHomePage")];
      break;
    case "general_linkTargeting":
      elems = [findElement.ID(root, "linkTargeting")];
      break;
    case "general_makeDefault":
      elems = [findElement.ID(root, "setDefaultButton")];
      break;
    case "general_restoreHomePage":
      elems = [findElement.ID(root, "restoreDefaultHomePage")];
      break;
    case "general_restoreOnDemand":
      elems = [findElement.ID(root, "restoreOnDemand")];
      break;
    case "general_switchToNewTabs":
      elems = [findElement.ID(root, "switchToNewTabs")];
      break;
    case "general_useBookmark":
      elems = [findElement.ID(root, "useBookmark")];
      break;
    case "general_useCurrent":
      elems = [findElement.ID(root, "useCurrent")];
      break;
    case "general_warnCloseMultiple":
      elems = [findElement.ID(root, "warnCloseMultiple")];
      break;
    case "general_warnOpenMany":
      elems = [findElement.ID(root, "warnOpenMany")];
      break;
    case "privacy_acceptCookies":
      elems = [findElement.ID(root, "acceptCookies")];
      break;
    case "privacy_acceptThirdPartyCookies":
      elems = [findElement.ID(root, "acceptThirdPartyMenu")];
      break;
    case "privacy_bookmarksSuggestions":
      elems = [findElement.ID(root, "bookmarkSuggestion")];
      break;
    case "privacy_clearDataSettings":
      elems = [findElement.ID(root, "clearDataSettings")];
      break;
    case "privacy_clearHistoryOnClose":
      elems = [findElement.ID(root, "alwaysClear")];
      break;
    case "privacy_cookieExceptions":
      elems = [findElement.ID(root, "cookieExceptions")];
      break;
    case "privacy_doNotTrack":
      elems = [findElement.ID(root, "privacyDoNotTrackCheckbox")];
      break;
    case "privacy_doNotTrackInfo":
      elems = [findElement.ID(root, "doNotTrackInfo")];
      break;
    case "privacy_historyMode":
      elems = [findElement.ID(root, "historyMode")];
      break;
    case "privacy_historySuggestions":
      elems = [findElement.ID(root, "historySuggestion")];
      break;
    case "privacy_keepCookiesUntil":
      elems = [findElement.ID(root, "keepCookiesUntil")];
      break;
    case "privacy_openPagesSuggestion":
      elems = [findElement.ID(root, "openpageSuggestion")];
      break;
    case "privacy_privateBrowsingAutoStart":
      elems = [findElement.ID(root, "privateBrowsingAutoStart")];
      break;
    case "privacy_rememberForms":
      elems = [findElement.ID(root, "rememberForms")];
      break;
    case "privacy_rememberHistory":
      elems = [findElement.ID(root, "rememberHistory")];
      break;
    case "privacy_showCookies":
      elems = [findElement.ID(root, "showCookiesButton")];
      break;
    case "search_addEngines":
      elems = [findElement.ID(root, "addEngines")];
      break;
    case "search_defaultEngine":
      elems = [findElement.ID(root, "defaultEngine")];
      break;
    case "search_searchProviderList":
      elems = [findElement.ID(root, "oneClickProvidersList")];
      break;
    case "search_searchProvider":
      nodeCollector.root = this.getElement({type: "search_searchProviderList"});
      nodeCollector.queryNodes("richlistitem")
                   .filterByDOMProperty(aSpec.subtype, aSpec.value);
      elems = nodeCollector.elements;
      break;
    case "search_suggestionsInSearchFields":
      elems = [findElement.ID(root, "suggestionsInSearchFieldsCheckbox")];
      break;
    case "security_blockAttackSites":
      elems = [findElement.ID(root, "blockAttackSites")];
      break;
    case "security_blockWebForgeries":
      elems = [findElement.ID(root, "blockWebForgeries")];
      break;
    case "security_changeMasterPassword":
      elems = [findElement.ID(root, "changeMasterPassword")];
      break;
    case "security_savePasswords":
      elems = [findElement.ID(root, "savePasswords")];
      break;
    case "security_savePasswordsExceptions":
      elems = [findElement.ID(root, "passwordExceptions")];
      break;
    case "security_showPasswords":
      elems = [findElement.ID(root, "showPasswords")];
      break;
    case "security_useMasterPassword":
      elems = [findElement.ID(root, "useMasterPassword")];
      break;
    case "security_warnAddonInstall":
      elems = [findElement.ID(root, "warnAddonInstall")];
      break;
    case "security_warnAddonInstallExceptions":
      elems = [findElement.ID(root, "addonExceptions")];
      break;
    case "sync_disconnectButton":
      elems = [findElement.ID(root, "fxaUnlinkButton")];
      break;
    case "sync_email":
      elems = [findElement.ID(root, "fxaEmailAddress1")];
      break;
    case "sync_fxaSyncComputerName":
      elems = [findElement.ID(root, "fxaSyncComputerName")];
      break;
    case "sync_manageButton":
      elems = [findElement.ID(root, "verifiedManage")];
      break;
    case "sync_preference":
      nodeCollector.root = this.getElement({type: "sync_preferences"});
      nodeCollector.queryNodes("checkbox")
                   .filterByDOMProperty(aSpec.subtype, aSpec.value);
      elems = nodeCollector.elements;
      break;
    case "sync_preferences":
      elems = [findElement.Selector(root, "#fxaSyncEngines checkbox")];
      break;
    case "sync_privacyPolicy":
      elems = [findElement.ID(root, "tosPP-small-PP")];
      break;
    case "sync_signIn":
      elems = [findElement.ID(root, "noFxaSignIn")];
      break;
    case "sync_signUp":
      elems = [findElement.ID(root, "noFxaSignUp")];
      break;
    case "sync_termsOfService":
      elems = [findElement.ID(root, "tosPP-small-ToS")];
      break;
    case "sync_unverifiedUnlinkFxaAccount":
      elems = [findElement.ID(root, "unverifiedUnlinkFxaAccount")];
      break;
    case "sync_useOldSync":
      elems = [findElement.ID(root, "noFxaUseOldSync")];
      break;
    case "sync_verifyFxaAccount":
      elems = [findElement.ID(root, "verifyFxaAccount")];
      break;
    case "sync_weavePrefsDeck":
      elems = [findElement.ID(root, "weavePrefsDeck")];
      break;
    default:
      assert.fail("Unknown element type - " + spec.type);
  }

  return elems;
};

/**
 * Open the about:preferences in-content page
 *
 * @params {function} aCallback
 *         Callback that opens the page
 */
AboutPreferencesPage.prototype.open = function APP_open(aCallback) {
  var initialized = false;
  var initialize = () => { initialized = true; };
  this.browserWindow.controller.window.addEventListener("Initialized", initialize);

  try {
    baseInContentPage.BaseInContentPage.prototype.open.call(this, aCallback);

    // Wait for the Initialized event
    assert.waitFor(() => initialized,
                   "Preferences panes have been initialized");
  }
  finally {
   this.browserWindow.controller.window.removeEventListener("Initialized", initialize)
  }
};

// Export of classes
exports.AboutPreferencesPage = AboutPreferencesPage;
