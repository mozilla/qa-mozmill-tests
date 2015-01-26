/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The WidgetsAPI adds support for handling objects like trees.
 */

var EventUtils = {};
Cu.import('resource://mozmill/stdlib/EventUtils.js', EventUtils);

/**
 * Click the specified tree cell
 *
 * @param {MozMillController} aController
 *        MozMillController of the browser window to operate on
 * @param {tree} aTree
 *        Tree to operate on
 * @param {number } aRowIndex
 *        Index of the row
 * @param {number} aColumnIndex
 *        Index of the column
 * @param {object} aEventDetails
 *        Details about the mouse event
 */
function clickTreeCell(aController, aTree, aRowIndex, aColumnIndex, aEventDetails) {
  aTree = aTree.getNode();

  var selection = aTree.view.selection;
  selection.select(aRowIndex);
  aTree.treeBoxObject.ensureRowIsVisible(aRowIndex);

  // get cell coordinates
  var x = {}, y = {}, width = {}, height = {};
  var column = aTree.columns[aColumnIndex];
  aTree.treeBoxObject.getCoordsForCellItem(aRowIndex, column, "text",
                                           x, y, width, height);

  aController.sleep(0);
  EventUtils.synthesizeMouse(aTree.body, x.value + 4, y.value + 4,
                             aEventDetails, aTree.ownerDocument.defaultView);

  assert.waitFor(() => aTree.view.selection.isSelected(aRowIndex),
                 "Cell from the row '" + aRowIndex + "' has been selected");
}

/**
 * Get the selected Cell
 *
 * @param {MozElement} aTree
 *        Element tree to operate on
 *
 * @returns {object} The selected cell node
 */
function getSelectedCell(aTree) {
  var treeNode = aTree.getNode();
  return treeNode.view.nodeForTreeIndex(treeNode.currentIndex);
}

// Export of functions
exports.clickTreeCell = clickTreeCell;
exports.getSelectedCell = getSelectedCell;
