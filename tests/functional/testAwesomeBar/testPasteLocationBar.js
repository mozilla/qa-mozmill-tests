/** Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

// Include required modules
var places = require("../../../lib/places");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

const LOCAL_TEST_FOLDER = collector.addHttpResource('../../../data/');

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  locationBar =  new toolbars.locationBar(controller);

  // Clear complete history so we don't get interference from previous entries
  places.removeAllHistory();

  // Clear the clipboard so we don't get data from previous tests in clipboard
  utils.emptyClipboard();
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

  // Get contents of the location bar and compare it to the expected result
  controller.waitFor(function () {
    return locationBar.value === docSelection;
  }, "Location bar should contain pasted clipboard content - got " +
    locationBar.value + ", expected " + docSelection);
}
