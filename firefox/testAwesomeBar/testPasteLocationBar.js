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
 * The Original Code is MozMill Test code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 *
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Al Billings <abillings@mozilla.com>
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
var places = require("../../shared-modules/places");
var toolbars = require("../../shared-modules/toolbars");
var utils = require("../../shared-modules/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');

function setupModule() {
  controller = mozmill.getBrowserController();
  locationBar = new toolbars.locationBar(controller);

  // Create a new menu instance for the context menu
  contextMenu = controller.getMenu("#contentAreaContextMenu");

  // Clear complete history so we don't get interference from previous entries
  places.removeAllHistory();

  // Clear the clipboard so we don't get data from previous tests in clipboard
  utils.emptyClipboard();
}

function teardownModule() {
  locationBar.closeContextMenu();
}

/**
 * Grab some text from a web page and then paste it into the toolbar
 *
 */
function testPasteLocationBar() {
  // Open the test page
  controller.open(LOCAL_TEST_FOLDER + "awesomebar/copypaste.html");
  controller.waitForPageLoad();

  // Focus on page, select text and copy to clipboard
  ipsumLocation = new elementslib.ID(controller.window.document, 'ipsum');
  controller.doubleClick(ipsumLocation);
  var docSelection = controller.tabs.activeTabWindow.getSelection().toString();
  
  // Copy "ipsum" into clipboard
  contextMenu.open(ipsumLocation);
  contextMenu.select("#context-copy", ipsumLocation);

  // Clear the locationBar
  locationBar.clear();

  // Get the urlbar input box, right click in it, and select paste from context menu
  var input = locationBar.getElement({type: "urlbar_input"});
  contextMenu.open(input);
  contextMenu.select("#context-paste", input);

  // Get contents of the location bar and compare it to expected result  
  controller.waitFor(function () {
    return locationBar.value === docSelection;
  }, "Location bar should contain pasted clipboard content - got " +
    locationBar.value + ", expected " + docSelection);
}
