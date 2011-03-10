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
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aakash Desai <adesai@mozilla.com>
 *   Aaron Train <atrain@mozilla.com>
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

// Include required modules
var modalDialog = require("../../../lib/modal-dialog");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'form_manager/form.html';

const FNAME = "John";
const LNAME = "Smith";

var setupModule = function() {
  controller = mozmill.getBrowserController();

  // Clear complete form history so we don't interfere with already added entries
  try {
    var formHistory = Cc["@mozilla.org/satchel/form-history;1"].
                      getService(Ci.nsIFormHistory2);
    formHistory.removeAllEntries();
  } catch (ex) {}
}

/**
 * Verify saving and filling in form information
 */
var testSaveFormInformation = function() {
  // Go to the sample form page and submit form data
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var firstName = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  var lastName = new elementslib.ID(controller.tabs.activeTab, "ship_lname");
  var submitButton = new elementslib.ID(controller.tabs.activeTab, "SubmitButton");

  controller.type(firstName, FNAME);
  controller.type(lastName, LNAME);

  controller.click(submitButton);
  controller.waitForPageLoad();

  firstName = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  controller.waitForElement(firstName, TIMEOUT);
  controller.type(firstName, FNAME.substring(0,2));

  // Verify form completion in each inputted field
  var popDownAutoCompList = new elementslib.ID(controller.window.document, "PopupAutoComplete");

  // TODO: Restore after 1.5.1 lands
  // controller.waitFor(function() {
  //   return popDownAutoCompList.getNode().popupOpen == true;
  // }, TIMEOUT, 100, "Autocomplete popup is open");
  
  controller.waitForEval("subject.popupOpen", TIMEOUT, 100,
                         popDownAutoCompList.getNode());

  controller.keypress(firstName, "VK_DOWN", {});
  controller.click(popDownAutoCompList);
  controller.assertValue(firstName, FNAME);

  lastName = new elementslib.ID(controller.tabs.activeTab, "ship_lname");
  controller.type(lastName, LNAME.substring(0,2));

  // TODO: Restore after 1.5.1 lands
  // controller.waitFor(function() {
  //   return popDownAutoCompList.getNode().popupOpen == true;
  // }, TIMEOUT, 100, "Autocomplete popup is open");
  
  controller.waitForEval("subject.popupOpen", TIMEOUT, 100,
                         popDownAutoCompList.getNode());

  controller.keypress(lastName, "VK_DOWN", {});
  controller.click(popDownAutoCompList);
  controller.assertValue(lastName, LNAME);
}

/**
 * Verify clearing form and search history
 */
var testClearFormHistory = function() {
  // Call clear recent history dialog and clear all form history
  var md = new modalDialog.modalDialog(controller.window);
  md.start(clearHistoryHandler);

  controller.click(new elementslib.Elem(controller.menus["tools-menu"].sanitizeItem));
  md.waitForDialog();

  // Verify forms are cleared
  var popDownAutoCompList = new elementslib.ID(controller.window.document, "PopupAutoComplete");

  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var firstName = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  var lastName = new elementslib.ID(controller.tabs.activeTab, "ship_lname");

  // Begin typing into the name fields and verify no popup
  controller.waitForElement(firstName, TIMEOUT);
  controller.type(firstName, FNAME.substring(0,2));
  controller.sleep(500);
  controller.assertJSProperty(popDownAutoCompList, "popupOpen", false);

  controller.type(lastName, LNAME.substring(0,2));
  controller.sleep(500);
  controller.assertJSProperty(popDownAutoCompList, "popupOpen", false);
}

/**
 * Accesses the clear recent history dialog and accepts the default options to clear
 */
var clearHistoryHandler = function(controller) {
  // Verify the checkbox to clear form data is checked
  var checkBox = new elementslib.XPath(controller.window.document, 
                                       "/*[name()='prefwindow']" + 
                                       "/*[name()='prefpane'][1]" + 
                                       "/*[name()='listbox'][1]" + 
                                       "/*[name()='listitem'][2]");
  controller.waitForElement(checkBox, TIMEOUT);
  controller.assertChecked(checkBox);

  var clearButton = new elementslib.Lookup(controller.window.document, 
                                           '/id("SanitizeDialog")' + 
                                           '/anon({"anonid":"dlg-buttons"})' + 
                                           '/{"dlgtype":"accept"}');
  controller.waitThenClick(clearButton);
}

/**
 * Map test functions to litmus tests
 */
// testSaveFormInformation.meta = {litmusids : [6010]};
// testClearFormHistory.meta = {litmusids : [6009]};
