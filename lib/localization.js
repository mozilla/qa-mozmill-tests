/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var {expect} = require("assertions");
var domUtils = require("dom-utils");
var screenshot = require("screenshot");
var utils = require("utils");

// A map translating platform dependent locales to their normalized locale
const NORMALIZATION_MAP = {
  "ja-JP-mac" : "ja"
}

/**
 * Callback function for parsing the results of testing for duplicated
 * access keys.
 *
 * This function processes the access keys found in one access keys scope
 * looking for access keys that are listed more than one time.
 * At the end, it calls the screenshot.create to create a screenshot with the
 * elements containing the broken access keys highlighted.
 *
 * @param {array of array of object} aAccessKeysSet
 * @param {MozmillController} aController
 */
function checkAccessKeysResults(aController, aAccessKeysSet) {
  // Sort the access keys to have them in a A->Z order
  var accessKeysList = aAccessKeysSet.sort();

  // List of access keys
  var aKeysList = [];

  // List of values to identify the access keys
  var valueList = [];

  // List of rectangles of nodes containing access keys
  var rects = [];

  // List of rectangles of nodes with broken access keys
  var badRects = [];

  // Makes lists of all access keys and the values the access keys are in
  for (var i = 0; i < accessKeysList.length; i++) {
    var accessKey = accessKeysList[i][0];
    var node = accessKeysList[i][1];

    var box = node.boxObject;

    var innerIds = [];
    var innerRects = [];

    // if the access key is already in our list, take it out to replace it
    // later
    if (accessKey == aKeysList[aKeysList.length-1]) {
      innerIds = valueList.pop();
      innerRects = rects.pop();
    }
    else {
      aKeysList.push([accessKey]);
    }

    innerIds.push(_reportNode(node));
    valueList.push(innerIds);
    innerRects.push([box.x, box.y, box.width, box.height]);
    rects.push(innerRects);
  }

  // Go through all access keys and find the duplicated ones
  for (var i = 0; i < valueList.length; i++) {
    // Only access keys contained in more than one node are the ones we are
    // looking for
    if (valueList[i].length > 1) {
      for (var j = 0; j < rects[i].length; j++) {
        badRects.push(rects[i][j]);
      }
      expect.fail('accessKey: "' + aKeysList[i] + '" found in: ' +
                  valueList[i].join(", "));
    }
  }

  // If we have found broken access keys, make a screenshot
  if (badRects.length > 0) {
    screenshot.create(aController, badRects);
  }
}

/**
 * Callback function for testing for cropped elements.
 *
 * Checks if the XUL boxObject has screen coordinates outside of
 * the screen coordinates of its parent. If there's no parent, return.
 *
 * @param {node} aChild
 * @returns List of boxes that can be highlighted on a screenshot
 * @type {array of array of int}
 */
function checkDimensions(aChild) {
  if (!aChild.boxObject)
    return [];
  var tolerance = 1;
  var childBox = aChild.boxObject;
  var parent = childBox.parentBox;

  // toplevel element or hidden elements, like script tags
  if (!parent || parent == aChild.element || !parent.boxObject) {
    return [];
  }
  var parentBox = parent.boxObject;

  var badRects = [];
  var pixels;

  // check for horizontal overflow bigger than the tolerance,
  // for elements higher than the tolerance
  if (childBox.offsetHeight > tolerance &&
      childBox.screenX + tolerance < parentBox.screenX) {
    pixels = parentBox.x - childBox.x;
    badRects.push([childBox.x, childBox.y, pixels,
                   childBox.height]);
    expect.fail('Node is cut off by ' + pixels +
                ' px at the left: ' + _reportNode(child) +
                '. Parent node: ' + _reportNode(parent));
  }
  if (childBox.offsetHeight > tolerance &&
      childBox.screenX + childBox.offsetWidth >
      parentBox.screenX + parentBox.offsetWidth + tolerance) {
    pixels = childBox.x + childBox.offsetWidth - parentBox.x - parentBox.offsetWidth;
    badRects.push([parentBox.x + parentBox.offsetWidth, childBox.y,
                   pixels, childBox.offsetHeight]);
    expect.fail('Node is cut off by ' + pixels +
                ' px at the right: ' + _reportNode(aChild) +
                '. Parent node: ' + _reportNode(parent));
  }

  // check for vertical overflow bigger than the tolerance,
  // for elements wider than the tolerance
  // We don't want to test menupopup's, as they always report the full height
  // of all items in the popup
  if (aChild.nodeName != 'menupopup' && parent.nodeName != 'menupopup') {
    if (childBox.offsetWidth > tolerance &&
        childBox.screenY + tolerance < parentBox.screenY) {
      pixels = parentBox.y - childBox.y;
      badRects.push([childBox.x, childBox.y,
                     childBox.offsetWidth, pixels]);
      expect.fail('Node is cut off by ' + pixels +
                  ' px at the top: ' + _reportNode(aChild) +
                  '. Parent node: ' + _reportNode(parent));
    }
    if (childBox.offsetWidth > tolerance &&
        childBox.screenY + childBox.offsetHeight >
        parentBox.screenY + parentBox.offsetHeight + tolerance) {
      pixels = childBox.y + childBox.offsetHeight - parentBox.y - parentBox.offsetHeight;
      badRects.push([childBox.x, parentBox.y + parentBox.offsetHeight,
                     childBox.offsetWidth, pixels]);
      expect.fail('Node is cut off by ' + pixels +
                  ' px at the bottom: ' + _reportNode(aChild) +
                  '. Parent node: ' + _reportNode(parent));
    }
  }

  return badRects;
}

/**
 * Filters out nodes which should not be tested because they are not in the
 * current access key scope.
 *
 * @param {node} aNode
 * @returns Filter status of the given node
 * @type {array of array of int}
 */
function filterAccessKeys(aNode) {
  // Menus will need a separate filter set
  var notAllowedLocalNames = ["menu", "menubar", "menupopup", "popupset"];

  if (!aNode.disabled && !aNode.collapsed && !aNode.hidden &&
      notAllowedLocalNames.indexOf(aNode.localName) == -1) {
    // Code specific to the preferences panes to reject out not visible nodes
    // in the panes.
    if (aNode.parentNode && (aNode.parentNode.localName == "prefwindow" &&
                             aNode.parentNode.currentPane.id != aNode.id) ||
        ((aNode.parentNode.localName == "tabpanels" ||
          aNode.parentNode.localName == "deck") &&
          aNode.parentNode.selectedPanel.id != aNode.id)) {
      return domUtils.DOMWalker.FILTER_REJECT;
      // end of the specific code
    }
    else if (aNode.accessKey) {
      return domUtils.DOMWalker.FILTER_ACCEPT;
    }
    else {
      return domUtils.DOMWalker.FILTER_SKIP;
    }
  }
  else {
    // we don't want to test not visible elements
    return domUtils.DOMWalker.FILTER_REJECT;
  }
}

/**
 * Filters out nodes which should not be tested because they are not visible
 *
 * @param {node} aNode
 * @returns Filter status of the given node
 * @type {array of array of int}
 */
function filterCroppedNodes(aNode) {
  if (!aNode.boxObject) {
    return domUtils.DOMWalker.FILTER_SKIP;
  }
  else {
    if (!aNode.disabled && !aNode.collapsed && !aNode.hidden) {
      // Code specific to the preferences panes to reject out not visible nodes
      // in the panes.
      if (aNode.parentNode && (aNode.parentNode.localName == "prefwindow" &&
                               aNode.parentNode.currentPane.id != aNode.id) ||
          ((aNode.parentNode.localName == "tabpanels" ||
            aNode.parentNode.localName == "deck") &&
           aNode.parentNode.selectedPanel.id != aNode.id)) {
        return domUtils.DOMWalker.FILTER_REJECT;
        // end of the specific code
      }
      else {
        return domUtils.DOMWalker.FILTER_ACCEPT;
      }
    }
    else {
      // we don't want to test not visible elements
      return domUtils.DOMWalker.FILTER_REJECT;
    }
  }
}

/**
 * Translate a possible platform specific locale to its normalized locale
 *
 * @param {String} [aLocale = utils.appInfo.locale] The locale to be mapped
 * @returns {String} Parent locale
 */
function normalizeLocale(aLocale) {
  var locale = aLocale || utils.appInfo.locale;

  if (locale in NORMALIZATION_MAP) {
    locale = NORMALIZATION_MAP[locale];
  }

  return locale;
}

/**
 * Callback function for testing access keys. To be used with the DOMWalker.
 *
 * It packs a submitted node and its access key into a double array
 *
 * @param {node} aNode Node containing the access key
 * @returns lower-cased access key and its node in a nested array
 * @type {array of array}
 */
function prepareAccessKey(aNode) {
  return [[aNode.accessKey.toLowerCase(), aNode]];
}

/**
 * Callback function for parsing the results of testing for cropped elements.
 *
 * This function calls the screenshot.create method if there is at least one
 * box.
 *
 * @param {array of array of int} aBoxes
 * @param {MozmillController} aController
 */
function processDimensionsResults(aController, aBoxes) {
  if (aBoxes && aBoxes.length > 0) {
    screenshot.create(aController, aBoxes);
  }
}

/**
 * Tries to return a useful string identificator of the given node
 *
 * @param {node} aNode
 * @returns Identificator of the node
 * @type {String}
 */
function _reportNode(aNode) {
  if (aNode.id) {
    return aNode.localName + "#" + aNode.id;
  }
  else if (aNode.label) {
    return aNode.localName + "[label=" + aNode.label + "]";
  }
  else if (aNode.value) {
    return "value: " + aNode.value;
  }
  else if (aNode.hasAttributes()) {
    var attrs = aNode.localName;
    for (var i = aNode.attributes.length - 1; i >= 0; i--) {
      attrs += "[" + aNode.attributes[i].name + "=" + aNode.attributes[i].value + "]";
    }
    return attrs;
  }
  else {
    return "anonymous node";
  }
}

// Export of functions
exports.checkAccessKeysResults = checkAccessKeysResults;
exports.checkDimensions = checkDimensions;
exports.filterAccessKeys = filterAccessKeys;
exports.filterCroppedNodes = filterCroppedNodes;
exports.normalizeLocale = normalizeLocale;
exports.prepareAccessKey = prepareAccessKey;
exports.processDimensionsResults = processDimensionsResults;
