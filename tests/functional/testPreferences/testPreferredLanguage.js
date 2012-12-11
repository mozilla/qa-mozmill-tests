/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var { expect } = require("../../../lib/assertions");
var modalDialog = require("../../../lib/modal-dialog");
var prefs = require("../../../lib/prefs");
var utils = require("../../../lib/utils");

const PREF_ACCEPT_LANG = "intl.accept_languages";

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  module.browserLocale = utils.appInfo.locale;
}

var teardownModule = function(module) {
  prefs.preferences.clearUserPref(PREF_ACCEPT_LANG);
}

/**
 * Choose your preferred language for display
 */
var testSetLanguages = function () {
  // Call preferences dialog and set primary language to Italian
  prefs.openPreferencesDialog(controller, prefDialogCallback);

  var acceptedLanguage = prefs.preferences.getPref(PREF_ACCEPT_LANG, '');

  // If we test an Italian build, check that the primary language is Polish
  if (browserLocale === "it") {
    expect.ok(acceptedLanguage.indexOf("pl") === 0,
              "The primary language set is Polish");
  }
  else {
    // Verify the primary language is Italian
    expect.ok(acceptedLanguage.indexOf("it") === 0,
              "The primary language set is Italian");
  }
}

/**
 * Open preferences dialog to switch the primary language
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var prefDialogCallback = function(controller) {
  var prefDialog = new prefs.preferencesDialog(controller);
  prefDialog.paneId = 'paneContent';

  // Call language dialog and set Italian as primary language
  var md = new modalDialog.modalDialog(controller.window);
  md.start(langHandler);

  var language = new elementslib.ID(controller.window.document, "chooseLanguage");
  controller.waitThenClick(language);
  md.waitForDialog();

  prefDialog.close(true);
}

/**
 * Callback handler for languages dialog
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
var langHandler = function(controller) {
  // Add the Italian Language, or Polish, if it is an Italian build
  if (browserLocale === "it") {
    var language = utils.getProperty("chrome://global/locale/languageNames.properties",
                                     "pl");
  } else {
    var language = utils.getProperty("chrome://global/locale/languageNames.properties",
                                     "it");
  }

  // Select the language from the list
  var langDropDown = new elementslib.ID(controller.window.document, "availableLanguages");
  controller.waitForElement(langDropDown);

  for (i = 0; i < language.length; i++) {
    controller.keypress(langDropDown, language[i], {});
    controller.sleep(100);
  };

  // Wait until the add button has been enabled
  var addButton = new elementslib.ID(controller.window.document, "addButton");
  controller.waitFor(function () {
    return !addButton.getNode().disabled;
  }, "The 'Add' button has been enabled");
  controller.click(addButton);

  // Move the Language to the Top of the List and Accept the new settings
  var upButton = new elementslib.ID(controller.window.document, "up");

  while (upButton.getNode().getAttribute("disabled") != "true") {
    controller.click(upButton);
    controller.sleep(0);
  };

  // Save and close the languages dialog window
  var okButton = new elementslib.Lookup(controller.window.document, '/id("LanguagesDialog")' +
                                                                    '/anon({"anonid":"dlg-buttons"})' +
                                                                    '/{"dlgtype":"accept"}');
  controller.click(okButton);
}
