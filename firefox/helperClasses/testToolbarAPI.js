/** Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/
 */

var jum = {}; Components.utils.import('resource://mozmill/modules/jum.js', jum);

// Include necessary modules
const RELATIVE_ROOT = '../../shared-modules';
const MODULE_REQUIRES = ['ToolbarAPI'];

const TIMEOUT = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  locationBar = new ToolbarAPI.locationBar(controller);
}

var testLocationBarAPI = function() {
  // Test access to available elements
  var input = locationBar.getElement({type: "urlbar_input"});
  jum.assertEquals(input.getNode().localName, "input");

  var contextMenu = locationBar.getElement({type: "contextMenu"});
  jum.assertEquals(contextMenu.getNode().localName, "menupopup");

  var contextMenuEntry = locationBar.getElement({type: "contextMenu_entry", subtype: "paste"});
  jum.assertEquals(contextMenuEntry.getNode().localName, "menuitem");
}
