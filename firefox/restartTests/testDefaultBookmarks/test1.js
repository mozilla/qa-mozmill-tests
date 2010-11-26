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
 * The Initial Developer of the Original Code is Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
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

// Include required modules
var domUtils = require("../../../shared-modules/dom-utils");
var modalDialog = require("../../../shared-modules/modal-dialog");
var places = require("../../../shared-modules/places");
var toolbars = require("../../../shared-modules/toolbars");

function setupModule(module) {
  controller = mozmill.getBrowserController();

  locationbar = new toolbars.locationBar(controller);
  nodeCollector = new domUtils.nodeCollector(controller.window.document);

  bs = places.bookmarksService;
  hs = places.historyService;
  ls = places.livemarkService;
}

function teardownModule(module) {
  delete persisted.toolbarNodes;
}

function testVerifyDefaultBookmarks() {
  var toolbar = new elementslib.ID(controller.window.document, "PersonalToolbar");

  // Make sure bookmarks toolbar is open
  controller.waitFor(function() {
    return toolbar.getNode().collapsed == false;
  }, "Bookmarks Toolbar is visible");

  // Get list of items on the bookmarks toolbar and open container
  var toolbarNodes = persisted.toolbarNodes = getBookmarkToolbarItems();
  toolbarNodes.containerOpen = true;

  nodeCollector.root = controller.window.document.getElementById("bookmarksBarContent");
  var items = nodeCollector.queryNodes("toolbarbutton").elements;

  // For a default profile there should be exactly 3 items
  controller.assert(function() {
    return items.length == 3;
  }, "Bookmarks Toolbar contains 3 items");

  // Check if the Most Visited folder is visible and has the correct title
  controller.assertJSProperty(items[0], "label", toolbarNodes.getChild(0).title);

  // Check Getting Started bookmarks title and load the page
  controller.assertJSProperty(items[1], "label", toolbarNodes.getChild(1).title);
  controller.click(items[1]);
  controller.waitForPageLoad();

  // Check for the correct path in the URL which also includes the locale
  controller.assertValue(locationbar.getElement({type: "urlbar"}),
                         toolbarNodes.getChild(1).uri);

  // Check the title of the default RSS feed toolbar button
  controller.assertJSProperty(items[2], "label", toolbarNodes.getChild(2).title);

  // Close the container
  toolbarNodes.containerOpen = false;

  // Create modal dialog observer
  var md = new modalDialog.modalDialog(controller.window);
  md.start(feedHandler);

  // XXX: We can't use the new Menu API because of an invalid menu id (bug 612143)
  // Open the properties dialog of the feed
  var properties = new elementslib.ID(controller.window.document,
                                      "placesContext_show:info");
  controller.rightClick(items[2]);
  controller.click(properties);
  md.waitForDialog();
}


/**
 * Callback handler for modal bookmark properties dialog
 *
 * @param controller {MozMillController} Controller of the modal dialog
 */
function feedHandler(controller) {
  try {
    // Get list of items on the bookmarks toolbar and open container
    persisted.toolbarNodes.containerOpen = true;
    var child = persisted.toolbarNodes.getChild(2);

    // Check if the child is a Livemark
    controller.assert(function() {
      return ls.isLivemark(child.itemId);
    }, "Feed item is a live mark");

    // Compare the site and feed URI's
    var siteLocation = new elementslib.ID(controller.window.document,
                                          "editBMPanel_siteLocationField");
    controller.assertValue(siteLocation, ls.getSiteURI(child.itemId).spec);

    var feedLocation = new elementslib.ID(controller.window.document,
                                          "editBMPanel_feedLocationField");
    controller.assertValue(feedLocation, ls.getFeedURI(child.itemId).spec);

  } finally {
    // Close container and properties dialog
    persisted.toolbarNodes.containerOpen = false;
    controller.keypress(null, "VK_ESCAPE", {});
  }
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

/**
 * Map test functions to litmus tests
 */
// testVerifyDefaultBookmarks.meta = {litmusids : [6717]};
