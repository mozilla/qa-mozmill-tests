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

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'form_manager/form.html';

var setupModule = function() {
  controller = mozmill.getBrowserController();

  try {
    // Clear complete form history so we don't interfer with already added entries
    var formHistory = Cc["@mozilla.org/satchel/form-history;1"].
                      getService(Ci.nsIFormHistory2);
    formHistory.removeAllEntries();
  } catch (ex) {
  }
}

var testFormCompletion = function() {
  var inputText = 'John';

  // Open the local site and verify it's the correct page
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  var inputField = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  controller.assertNode(inputField);

  // Fill out the name field with the input text and click Submit
  controller.type(inputField, inputText);
 
  var submitButton = new elementslib.ID(controller.tabs.activeTab, "SubmitButton");
  controller.click(submitButton);
  controller.waitForPageLoad();

  // Go to a filler local site: about:blank
  controller.open('about:blank');
  controller.waitForPageLoad();

  // Go back to the starting local page
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  // Verify name field element, and type in a portion of the field
  inputField = new elementslib.ID(controller.tabs.activeTab, "ship_fname");
  controller.type(inputField, inputText);

  // Select the first element of the drop down
  var popDownAutoCompList = new elementslib.Lookup(controller.window.document, 
    '/id("main-window")/id("mainPopupSet")/id("PopupAutoComplete")' +
    '/anon({"anonid":"tree"})/{"class":"autocomplete-treebody"}'
  );

  controller.keypress(inputField, "VK_DOWN", {});
  controller.sleep(1000);
  controller.click(popDownAutoCompList);

  // Verify the field element and the text in it
  controller.assertValue(inputField, inputText);
}

/**
 * Map test functions to litmus tests
 */
// testFormCompletion.meta = {litmusids : [7965]};
