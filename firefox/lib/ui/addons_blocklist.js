/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var domUtils = require("../../../lib/dom-utils");
var utils = require("../../../lib/utils");
var windows = require("../../../lib/windows");

/**
 * @class Class to handle the Blocklist Window
 */
function BlocklistWindow() {
  controller = this._controller;
}

BlocklistWindow.prototype = {
  /**
   * Get the controller of the window
   *
   * @returns {WindowController} Window Controller
   */
  get controller() {
    return this._controller;
  },

  /**
   * Open the Blocklist Window
   */
  open : function BlocklistWindow_open() {
    utils.updateBlocklist(false);

    this._controller = windows.handleWindow("type", "Addons:Blocklist", undefined, false);
  },

  ///////////////////////////////
  // UI Elements section
  ///////////////////////////////

  /**
   * Retrieve an UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   *        Elements: type     - Identifier of the element
   *                  subtype  - Attribute of the element to filter
   *                             [optional - default: ""]
   *                  value    - Value of the attribute to filter
   *                             [optional - default: ""]
   *                  parent   - Parent of the to find element
   *                             [optional - default: document]
   *
   * @returns Element which has been found
   * @type {ElemBase}
   */
  getElement : function BlocklistWindow_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   *        Elements: type     - Identifier of the element
   *                  subtype  - Attribute of the element to filter
   *                             [optional - default: ""]
   *                  value    - Value of the attribute to filter
   *                             [optional - default: ""]
   *                  parent   - Parent of the to find element
   *                             [optional - default: document]
   *
   * @returns Elements which have been found
   * @type {array of ElemBase}
   */
  getElements : function BlocklistWindow_getElements(aSpec) {
    var spec = aSpec || { };
    var type = spec.type;
    var subtype = spec.subtype;
    var value = spec.value;
    var parent = spec.parent;

    var root = parent ? parent.getNode() : this._controller.window;
    var nodeCollector = new domUtils.nodeCollector(root);

    switch (type) {
      case "addonList":
        nodeCollector.queryNodes("#addonList");
        break;
      case "bothMessage":
        nodeCollector.queryNodes("#bothMessage");
        break;
      case "disableCheckbox":
        nodeCollector.queryAnonymousNode("class", "disableCheckbox");
        break;
      case "hardBlockedAddon":
        nodeCollector.queryNodes(".hardBlockedAddon");
        break;
      case "hardBlockedMessage":
        nodeCollector.queryNodes("#hardBlockMessage");
        break;
      case "moreInfo":
        nodeCollector.queryNodes("#moreInfo");
        break;
      case "softBlockedAddon":
        nodeCollector.queryNodes(".softBlockedAddon");
        break;
      case "softBlockedMessage":
        nodeCollector.queryNodes("#softBlockMessage");
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return nodeCollector.elements;
  }
}

// Export of classes
exports.BlocklistWindow = BlocklistWindow;
