/** Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

// Include required modules
var places = require("../../shared-modules/places");
var toolbars = require("../../shared-modules/toolbars");
var utils = require("../../shared-modules/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../test-files/');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);

  // Clear complete history so we don't get interference from previous entries
  places.removeAllHistory();
  
  // Clear the clipboard so we don't get data from previous tests in clipboard
  utils.emptyClipboard() 
}

var teardownModule = function() {
  locationBar.closeContextMenu();
}

/**
 * Grab some text from a web page and then paste it into the toolbar
 *
 */
var testPasteLocationBar = function() {
  // Open the test page
  controller.open(LOCAL_TEST_FOLDER + "awesomebar/copypaste.html");
  controller.waitForPageLoad();

  // Focus on page, select text and copy to clipboard
  ipsumLocation = new elementslib.ID(controller.window.document, 'ipsum');
  controller.doubleClick(ipsumLocation);
  var docSelection = controller.tabs.activeTabWindow.getSelection().toString();

  // Copy "ipsum" into clipboard
  var dtds = ["chrome://browser/locale/browser.dtd"];
  var cmdKey = utils.getEntity(dtds, "copyCmd.key");
  controller.keypress(null, cmdKey, {accelKey: true});

  // Clear the locationBar
  locationBar.clear();

  // Get the urlbar input box, right click in it, and select paste from context menu
  var input = locationBar.getElement({type: "urlbar_input"});
  controller.rightClick(input);
  var contextMenuEntry = locationBar.getElement({type: "contextMenu_entry", subtype: "paste"});
  controller.click(contextMenuEntry);

  // Get contents of locationbar and compare it to expected result  
  controller.waitForEval("subject.urlbar.value == subject.selectedText", TIMEOUT, 100,
                         {urlbar: locationBar.urlbar.getNode(), selectedText: docSelection});
}
