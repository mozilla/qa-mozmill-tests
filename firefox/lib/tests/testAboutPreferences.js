/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var aboutPreferences = require("../ui/about-preferences-page");
var browser = require("../ui/browser");

const TEST_DATA = {
  "prefsPage": [
    {"category": "advanced", "elements": [
      {"name": "advanced_allowHardwareAcceleration", "value": "checkbox"},
      {"name": "advanced_allowSmartSize", "value": "checkbox"},
      {"name": "advanced_blockAutoRefresh", "value": "checkbox"},
      {"name": "advanced_cacheSizeValue", "value": "textbox"},
      {"name": "advanced_certSelection", "value": "radiogroup"},
      {"name": "advanced_checkSpelling", "value": "checkbox"},
      {"name": "advanced_clearCache", "value": "button"},
      {"name": "advanced_clearOfflineAppCache", "value": "button"},
      {"name": "advanced_connectionSettings", "value": "button"},
      {"name": "advanced_dataChoicesTab", "value": "tab"},
      {"name": "advanced_enableOCSP", "value": "checkbox"},
      {"name": "advanced_encryptionTab", "value": "tab"},
      {"name": "advanced_generalTab", "value": "tab"},
      {"name": "advanced_networkTab", "value": "tab"},
      {"name": "advanced_offlineAppsList", "value": "listbox"},
      {"name": "advanced_offlineAppsListRemove", "value": "button"},
      {"name": "advanced_offlineNotify", "value": "checkbox"},
      {"name": "advanced_offlineNotifyExceptions", "value": "button"},
      {"name": "advanced_searchEnginesUpdate", "value": "checkbox"},
      {"name": "advanced_searchStartTyping", "value": "checkbox"},
      {"name": "advanced_showUpdateHistory", "value": "button"},
      {"name": "advanced_submitCrashesBox", "value": "checkbox"},
      {"name": "advanced_submitHealthReportBox", "value": "checkbox"},
      {"name": "advanced_submitTelemetryBox", "value": "checkbox"},
      {"name": "advanced_updateRadioGroup", "value": "radiogroup"},
      {"name": "advanced_updateTab", "value": "tab"},
      {"name": "advanced_useAutoScroll", "value": "checkbox"},
      {"name": "advanced_useCursorNavigation", "value": "checkbox"},
      {"name": "advanced_useSmoothScrolling", "value": "checkbox"},
      {"name": "advanced_viewCertificates", "value": "button"},
      {"name": "advanced_viewSecurityDevices", "value": "button"},
      {"name": "advanced_warnIncompatibleAddons", "value": "checkbox"}
    ]},
    {"category": "application", "elements": [
      {"name": "application_applicationsHandlersList", "value": "richlistbox"},
      {"name": "application_filter", "value": "textbox"}
    ]},
    {"category": "content", "elements": [
      {"name": "content_chooseLanguage", "value": "button"},
      {"name": "content_font", "value": "menulist"},
      {"name": "content_fontAdvanced", "value": "button"},
      {"name": "content_fontSize", "value": "menulist"},
      {"name": "content_fontsColors", "value": "button"},
      {"name": "content_popupPolicy", "value": "checkbox"},
      {"name": "content_popupPolicyExceptions", "value": "button"}
    ]},
    {"category": "general", "elements": [
      {"name": "general_alwaysCheckDefault", "value": "checkbox"},
      {"name": "general_browserStartupPage", "value": "menulist"},
      {"name": "general_downloadFolder", "value": "filefield"},
      {"name": "general_downloadsSaveWhere", "value": "radiogroup"},
      {"name": "general_enable_e10s", "value": "checkbox"},
      {"name": "general_homePage", "value": "textbox"},
      {"name": "general_linkTargeting", "value": "checkbox"},
      {"name": "general_restoreHomePage", "value": "button"},
      {"name": "general_restoreOnDemand", "value": "checkbox"},
      {"name": "general_switchToNewTabs", "value": "checkbox"},
      {"name": "general_useBookmark", "value": "button"},
      {"name": "general_useCurrent", "value": "button"},
      {"name": "general_warnCloseMultiple", "value": "checkbox"},
      {"name": "general_warnOpenMany", "value": "checkbox"}
    ]},
    {"category": "privacy", "elements": [
      {"name": "privacy_acceptCookies", "value": "checkbox"},
      {"name": "privacy_acceptThirdPartyCookies", "value": "menulist"},
      {"name": "privacy_bookmarksSuggestions", "value": "checkbox"},
      {"name": "privacy_clearDataSettings", "value": "button"},
      {"name": "privacy_clearHistoryOnClose", "value": "checkbox"},
      {"name": "privacy_cookieExceptions", "value": "button"},
      {"name": "privacy_doNotTrack", "value": "checkbox"},
      {"name": "privacy_doNotTrackInfo", "value": "label"},
      {"name": "privacy_historyMode", "value": "menulist"},
      {"name": "privacy_historySuggestions", "value": "checkbox"},
      {"name": "privacy_keepCookiesUntil", "value": "menulist"},
      {"name": "privacy_openPagesSuggestion", "value": "checkbox"},
      {"name": "privacy_privateBrowsingAutoStart", "value": "checkbox"},
      {"name": "privacy_rememberForms", "value": "checkbox"},
      {"name": "privacy_showCookies", "value": "button"}
    ]},
    {"category": "search", "elements": [
      {"name": "search_addEngines", "value": "label"},
      {"name": "search_defaultEngine", "value": "menulist"},
      {"name": "search_searchProviderList", "value": "richlistitem"},
      {"name": "search_suggestionsInSearchFields", "value": "checkbox"}
    ]},
    {"category": "security", "elements": [
      {"name": "security_blockAttackSites", "value": "checkbox"},
      {"name": "security_blockWebForgeries", "value": "checkbox"},
      {"name": "security_changeMasterPassword", "value": "button"},
      {"name": "security_savePasswords", "value": "checkbox"},
      {"name": "security_savePasswordsExceptions", "value": "button"},
      {"name": "security_showPasswords", "value": "button"},
      {"name": "security_useMasterPassword", "value": "checkbox"},
      {"name": "security_warnAddonInstall", "value": "checkbox"},
      {"name": "security_warnAddonInstallExceptions", "value": "button"}
    ]},
    {"category": "sync", "elements": [
      {"name": "sync_disconnectButton", "value": "button"},
      {"name": "sync_email", "value": "label"},
      {"name": "sync_fxaSyncComputerName", "value": "textbox"},
      {"name": "sync_manageButton", "value": "button"},
      {"name": "sync_preferences", "value": "checkbox"},
      {"name": "sync_privacyPolicy", "value": "label"},
      {"name": "sync_signIn", "value": "label"},
      {"name": "sync_signUp", "value": "label"},
      {"name": "sync_termsOfService", "value": "label"},
      {"name": "sync_weavePrefsDeck", "value": "deck"}
    ]}
  ]
};

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
}

function teardownModule(aModule) {
  aModule.browserWindow.tabs.closeAllTabs();
}

/**
 * Test that the elements in library are present about:preferences
 */
function testPreferences() {
  var aboutPreferences = browserWindow.openAboutPreferencesPage();

  // Test preferences in-content elements exist
  TEST_DATA["prefsPage"].forEach(aCategory => {
    aboutPreferences.category = aCategory.category;

    aCategory.elements.forEach(aElement => {
      var el = aboutPreferences.getElement({type: aElement.name});
      expect.ok(() => (aElement.value === el.getNode().localName),
                "Element has been found - " + aElement.name);
    });
  });

  // Open about:accounts page from preferences sync pane
  aboutPreferences.category = "sync";
  var signInLink = aboutPreferences.getElement({type: "sync_signIn"});
  var aboutAccountsPage = browserWindow.openAboutAccountsPage(
    {type: "callback", callback: () => { signInLink.click(); }}
  );
  aboutAccountsPage.close();
}
