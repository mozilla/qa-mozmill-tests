/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var { assert, expect } = require("../../../../lib/assertions");
var { nodeCollector } = require("../../../../lib/dom-utils");
var modalDialog = require("../../../../lib/modal-dialog");
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");

var prefWindow = require("../../../lib/ui/pref-window");

const PREF_ACCEPT_LANG = "intl.accept_languages";
const PREF_BROWSER_IN_CONTENT = "browser.preferences.inContent";
const PREF_BROWSER_INSTANT_APPLY = "browser.preferences.instantApply";

var setupModule = function (aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.contentLocale = null;

  var intlProperties = prefs.getPref(PREF_ACCEPT_LANG, "", false,
                                     Ci['nsIPrefLocalizedString']);
  aModule.initLang = intlProperties.toString().toLowerCase().split(/\s*,\s*/);
  prefs.setPref(PREF_BROWSER_IN_CONTENT, false);
  if (mozmill.isWindows) {
    prefs.setPref(PREF_BROWSER_INSTANT_APPLY, false);
  }
}

var teardownModule = function (aModule) {
  prefs.clearUserPref(PREF_ACCEPT_LANG);
  prefs.clearUserPref(PREF_BROWSER_IN_CONTENT);
  prefs.clearUserPref(PREF_BROWSER_INSTANT_APPLY);
}

/**
 * Choose your preferred language for display
 */
var testChangeContentLanguage = function () {
  // Set a primary language, other than preinstalled locales
  prefWindow.openPreferencesDialog(controller, prefDialogCallback);

  var acceptedLanguage = prefs.getPref(PREF_ACCEPT_LANG, "", false,
                                       Ci['nsIPrefLocalizedString']);

  // Verify the primary language is correctly set
  expect.match(acceptedLanguage.toString(), "/^" + contentLocale + "/",
               "The primary language has been correctly updated");
}

/**
 * Open preferences dialog to switch the primary language
 *
 * @param {MozMillController} aController Controller of the window to operate on
 */
var prefDialogCallback = function (aController) {
  var prefDialog = new prefWindow.preferencesDialog(aController);
  prefDialog.paneId = "paneContent";

  // Call language dialog and set a new primary language
  var md = new modalDialog.modalDialog(aController.window);
  md.start(langHandler);

  var language = new elementslib.ID(aController.window.document, "chooseLanguage");
  aController.waitThenClick(language);
  md.waitForDialog();

  prefDialog.close(true);
}

/**
 * Callback handler for languages dialog
 *
 * @param {MozMillController} aController MozMillController of the window to operate on
 */
var langHandler = function (aController) {
  // Get the UI for the language list
  var langDropDown = new elementslib.ID(aController.window.document, "availableLanguages");
  aController.waitForElement(langDropDown);

  // Get the language list
  var collector = new nodeCollector(langDropDown.getNode());
  var languageList = collector.queryNodes("menuitem");

  // Filter out installed locales
  var filteredLanguageList = languageList.filter(function (aElement) {
    return initLang.indexOf(aElement.getAttribute("id")) === -1;
  });

  // Pick a random language
  var randomPosition = Math.floor(Math.random() * filteredLanguageList.nodes.length);
  var languageName = filteredLanguageList.nodes[randomPosition].getAttribute("label");
  contentLocale = filteredLanguageList.nodes[randomPosition].getAttribute("id");
  aController.select(langDropDown, null, languageName);

  // Wait until the add button has been enabled
  var addButton = new elementslib.ID(aController.window.document, "addButton");
  assert.waitFor(function () {
    return !addButton.getNode().disabled;
  }, "The 'Add' button has been enabled");
  aController.click(addButton);

  // Move the Language to the Top of the List and Accept the new settings
  var upButton = new elementslib.ID(aController.window.document, "up");
  assert.waitFor(function () {
    aController.click(upButton);
    return upButton.getNode().getAttribute("disabled") === "true";
  }, "The Language has been moved to the top of the list");

  // Save and close the languages dialog window
  var okButton = new elementslib.Lookup(aController.window.document,
                                        '/id("LanguagesDialog")' +
                                        '/anon({"anonid":"dlg-buttons"})' +
                                        '/{"dlgtype":"accept"}');
  aController.click(okButton);
}
