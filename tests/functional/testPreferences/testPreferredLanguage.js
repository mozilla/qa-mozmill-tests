/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include the required modules
var modalDialog = require("../../../lib/modal-dialog");
var prefs = require("../../../lib/prefs");
var utils = require("../../../lib/utils");

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
  module.browserLocale = utils.appInfo.locale;
}

var teardownModule = function(module) {
  prefs.preferences.clearUserPref("intl.accept_languages");
}

/**
 * Choose your preferred language for display
 */
var testSetLanguages = function () {
  controller.open("about:blank");

  // Call preferences dialog and set primary language to Italian
  prefs.openPreferencesDialog(controller, prefDialogCallback);

  // Open the Google Home page
  controller.open('http://www.google.com/');
  controller.waitForPageLoad();

  // Test the language of the site
  // If we test an Italian build, we have to use a non-Italian version of Google
  if (browserLocale == "it") {
    // Verify the site is Polish oriented
    controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Zaloguj"));
    controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Dokumenty"));
    controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Szukanie zaawansowane"));
  } else {
    // Verify the site is Italian oriented
    controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Accedi"));
    controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Documenti"));
    controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Ricerca avanzata"));
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
  controller.waitThenClick(language, gTimeout);
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
  if (browserLocale == "it") {
    var language = utils.getProperty("chrome://global/locale/languageNames.properties",
                                        "pl");
  } else {
    var language = utils.getProperty("chrome://global/locale/languageNames.properties",
                                        "it");
  }

  // Select the language from the list
  var langDropDown = new elementslib.ID(controller.window.document, "availableLanguages");
  controller.waitForElement(langDropDown, gTimeout);

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
    controller.sleep(gDelay);
  };

  // Save and close the languages dialog window
  controller.click(new elementslib.Lookup(controller.window.document, '/id("LanguagesDialog")/anon({"anonid":"dlg-buttons"})/{"dlgtype":"accept"}'));
}

/**
 * Map test functions to litmus tests
 */
// testSetLanguages.meta = {litmusids : [8322]};
