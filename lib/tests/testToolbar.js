/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var jum = {}; Components.utils.import('resource://mozmill/modules/jum.js', jum);

// Include required modules
var toolbars = require("../toolbars");

const TIMEOUT = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
  locationBar = new toolbars.locationBar(controller);
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
