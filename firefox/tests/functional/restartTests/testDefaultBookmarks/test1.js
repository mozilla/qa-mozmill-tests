/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var {assert, expect} = require("../../../../../lib/assertions");
var domUtils = require("../../../../../lib/dom-utils");
var localization = require("../../../../lib/localization");
var modalDialog = require("../../../../lib/modal-dialog");
var places = require("../../../../../lib/places");
var toolbars = require("../../../../lib/toolbars");
var utils = require("../../../../lib/utils");

const TEST_DATA = "https://www.mozilla.org/" +
                  localization.normalizeLocale() +
                  "/firefox/central/";

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.locationbar = new toolbars.locationBar(aModule.controller);
  aModule.nodeCollector = new domUtils.nodeCollector(aModule.controller.window.document);

  aModule.bs = places.bookmarksService;
  aModule.hs = places.historyService;
}

function teardownModule(aModule) {
  delete persisted.toolbarNodes;

  // Bug 886811
  // Mozmill 1.5 does not have the stopApplication method on the controller.
  // Remove condition when transitioned to 2.0
  if ("stopApplication" in aModule.controller) {
    aModule.controller.stopApplication(true);
  }
}

function testVerifyDefaultBookmarks() {
  var toolbar = new elementslib.ID(controller.window.document, "PersonalToolbar");
  assert.waitFor(function() {
    return toolbar.getNode().collapsed == true;
  }, "Bookmarks Toolbar is hidden by default");

  // On Windows XP and 2000 the Bookmarks Toolbar button is not displayed. Use
  // the navbar's context menu to toggle the Bookmarks Toolbar. Because the
  // back and forward buttons under Linux filling-up the complete height, we
  // have to click in the center of the navbar
  var navbar = new elementslib.ID(controller.window.document, "nav-bar");
  controller.rightClick(navbar, navbar.getNode().boxObject.width / 2, 2);

  var toggle = new elementslib.ID(controller.window.document,
                                  "toggle_PersonalToolbar");
  controller.mouseDown(toggle);
  controller.mouseUp(toggle);

  // Make sure bookmarks toolbar is now open
  assert.waitFor(function() {
    return toolbar.getNode().collapsed == false;
  }, "Bookmarks Toolbar is visible");

  // Get list of items on the bookmarks toolbar and open container
  var toolbarNodes = persisted.toolbarNodes = getBookmarkToolbarItems();
  toolbarNodes.containerOpen = true;

  nodeCollector.root = controller.window.document.getElementById("PlacesToolbarItems");
  var items = nodeCollector.queryNodes("toolbarbutton").elements;

  // For a default profile there should be exactly 2 items
  assert.equal(items.length, 2, "Bookmarks Toolbar contains 2 items");

  expect.equal(items[0].getNode().label, toolbarNodes.getChild(0).title,
               "The label of the Most Visited folder bookmark has been set correctly");
  expect.equal(items[1].getNode().label, toolbarNodes.getChild(1).title,
               "The label of the Getting Started bookmark has been set correctly");

  // Check for the correct link of the bookmark which also includes the locale
  expect.ok(places.isBookmarkInFolder(utils.createURI(TEST_DATA), bs.toolbarFolder),
            TEST_DATA + " is in the Toolbar Folder");

  // Close the container
  toolbarNodes.containerOpen = false;
}

/**
 * Get the Bookmarks Toolbar items
 */
function getBookmarkToolbarItems() {
  var options = hs.getNewQueryOptions();
  var query = hs.getNewQuery();

  query.setFolders([bs.toolbarFolder], 1);
  var root = hs.executeQuery(query, options).root;

  return root.QueryInterface(Ci.nsINavHistoryContainerResultNode);
}
