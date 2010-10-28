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
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
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

// Include the required modules
var modalDialog = require("../../shared-modules/testModalDialogAPI");
var prefs = require("../../shared-modules/testPrefsAPI");
var utils = require("../../shared-modules/testUtilsAPI");

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
  prefs.openPreferencesDialog(prefDialogCallback);

  // Open the Google Home page
  controller.open('http://www.google.com/');
  controller.waitForPageLoad();

  // Test the language of the site
  // If we test an Italian build, we have to use a non-Italian version of Google
  if (browserLocale == "it") {
    // Verify the site is Polish oriented
    controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Zaloguj"));
    controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Grupy"));
    controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Szukanie zaawansowane"));
  } else {
    // Verify the site is Italian oriented
    controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Accedi"));
    controller.assertNode(new elementslib.Link(controller.tabs.activeTab, "Gruppi"));
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
  var md = new modalDialog.modalDialog(langHandler);
  md.start(200);

  var language = new elementslib.ID(controller.window.document, "chooseLanguage");
  controller.waitThenClick(language, gTimeout);

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
  controller.waitForEval("subject.disabled == false", gTimeout, 100, addButton.getNode());
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
