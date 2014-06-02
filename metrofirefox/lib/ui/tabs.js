/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

var { assert } = require("../../../lib/assertions");
var domUtils = require("../../../lib/dom-utils");
var utils = require("../../../firefox/lib/utils");

/**
 * Constructor
 *
 * @param {MozMillController} aController
 *        Controller of the window
 */
function TabBrowser(aController) {
  if (!aController) {
    assert.fail("A valid controller must be specified");
  }

  this._controller = aController;
  this._root = this.getElement({type: "tabsContainer",
                                parent: this._controller.window.document});
}

/**
 * Prototype definition of the TabBrowser class
 */
TabBrowser.prototype = {
  /**
   * Returns the controller of the class instance
   *
   * @returns {MozMillController} Controller of the window
   */
  get controller() {
    return this._controller;
  },

  /**
   * Gets all the needed external DTD URLs as an array
   *
   * @returns {String[]} URL's of external DTD files
   */
  get dtds() {
    var dtds = ["chrome://browser/locale/browser.dtd"];

    return dtds;
  },

  /**
   * Returns the number of open tabs
   *
   * @returns {Number} Number of open tabs
   */
  get length() {
    return this.getElements({type: "tabs"}).length;
  },

  /**
   * Returns the index of the active tab
   *
   * @returns {Number} Index of the active tab
   */
  get selectedIndex() {
    var tabs = this.getElements({type: "tabs"});
    var index = -1;
    tabs.forEach((aItem, aIndex) => {
      if (aItem.getNode().getAttribute("selected") === "true") {
        index = aIndex;
      }
    });

    return index;
  },

  /**
   * Select the tab with the given index
   *
   * @param {number} aIndex
   *        Index of the tab which should be selected
   */
  set selectedIndex(aIndex) {
    this.getTab(aIndex).tap();
    assert.waitFor(() => (this.selectedIndex === aIndex),
                   "The tab with index '" + aIndex + "' has been selected");
  },

  /**
   * Retrieve an UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @param {object} type
   *        Identifier of the element
   * @param {object} [subtype=""]
   *        Attribute of the element to filter
   * @param {object} [value=""]
   *        Value of the attribute to filter
   * @param {object} [parent=document]
   *        Parent of the element to find
   *
   * @returns {object} Element which has been found
   */
  getElement : function tabBrowser_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   * @param {object} type
   *        Identifier of the element
   * @param {object} [subtype=""]
   *        Attribute of the element to filter
   * @param {object} [value=""]
   *        Value of the attribute to filter
   * @param {object} [parent="tabs-container"]
   *        Parent of the element to find
   *
   * @returns {Object[]} Array of elements which have been found
   */
  getElements : function tabBrowser_getElements(aSpec) {
    var spec = aSpec || { };
    var type = spec.type;
    var subtype = spec.subtype;
    var value = spec.value;
    var parent = spec.parent;
    var elems = null;

    var root = parent ? parent : this._root.getNode();
    var nodeCollector = new domUtils.nodeCollector(root);

    switch(spec.type) {
      case "closeButton":
        assert.ok(value, "Parent of the button has been specified");
        nodeCollector.root = value.getNode();
        nodeCollector.queryAnonymousNode("anonid", "close");
        elems = nodeCollector.elements;
        break;
      case "newTabButton":
        elems = [new findElement.ID(this._controller.window.document, "newtab-button")];
        break;
      // TODO: Move sidebar elements to a more specific place for them
      case "sidebar_backButton":
        elems = [new findElement.ID(this._controller.window.document, "overlay-back")];
        break;
      case "sidebar_newTabButton":
        elems = [new findElement.ID(this._controller.window.document, "overlay-plus")];
        break;
      case "tabsContainer":
        elems = [new findElement.ID(this._controller.window.document, "tabs-container")];
        break;
      case "tabs":
        nodeCollector.root = nodeCollector.queryNodes("#tabs").nodes[0];
        nodeCollector.queryAnonymousNode("anonid", "tabs-scrollbox");
        nodeCollector.root = nodeCollector.nodes[0];
        nodeCollector.queryNodes("documenttab");
        elems = nodeCollector.elements;
        break;
      case "tray":
        elems = [new findElement.ID(this._controller.window.document, "tray")];
        break;
      default:
        assert.fail("Unknown element type - " + aSpec.type);
    }

    return elems;
  },

  /**
   * Get the tab at the specified index
   *
   * @param {number} [aIndex=this.selectedIndex]
   *        Index of the tab
   *
   * @returns {ElemBase} The requested tab
   */
  getTab : function tabBrowser_getTab(aIndex) {
    if (aIndex === undefined) {
      aIndex = this.selectedIndex;
    }

    var tabList = this.getElements({type: "tabs"});
    assert.ok(tabList[aIndex] && tabList[aIndex].exists(),
              "Tab with index '" + aIndex + "' has been found.");
    return tabList[aIndex];
  },

  /**
   * Check if the tabs container at the top of the browser is visible
   *
   * @returns {Boolean} True if the tabs container is visible
   */
  isVisible: function tabBrowser_isVisible() {
    var tabs = this.getElement({type: "tray"});

    return tabs.getNode().hasAttribute("expanded");
  },

  /**
   * Open the tabs container at the top of the browser, which contains all current tabs
   *
   * @param {string} aMethod
   *        Specifies a method for opening the tabs container
   */
  openContainer: function tabBrowser_openContainer(aMethod) {
    var method = aMethod || "shortcut";

    switch (method) {
      case "shortcut":
        // Bug 964704
        // TODO: add code for shortcuts, if any
        break;
      case "touchEvent":
        // Bug 964704
        // TODO: add code for swipe up
        break;
      default:
        throw new Error("Unknown opening method - " + method);
    }

    var self = this;
    assert.waitFor(function () {
      return self.isVisible();
    }, "Tabs container is visible");
  },

  /**
   * Open a new tab
   *
   * @param {String} [aEventType="shortcut"]
   *        Type of event which triggers the action
   *
   */
  openTab : function tabBrowser_openTab(aEventType) {
    var type = aEventType || "shortcut";

    // Add event listeners to wait until the tab has been opened
    var self = {
      opened: false,
      animationend: false
    };

    function checkTabOpened() { self.opened = true; }
    function checkTabAnimationEnd() { self.animationend = true; }

    // Add event listener to wait until the tab has been opened
    this._controller.window.addEventListener("TabOpen", checkTabOpened);
    this._root.getNode().addEventListener("animationend", checkTabAnimationEnd);

    try {
      switch (type) {
        case "newTabButton":
          var newTabButton = this.getElement({type: "newTabButton"});
          newTabButton.tap();
          break;
        case "shortcut":
          var win = new findElement.MozMillElement("Elem", this._controller.window);
          var cmdKey = utils.getEntity(this.dtds, "newTab.key");
          win.keypress(cmdKey, {accelKey: true});
          break;
        case "shortcut2":
          var win = new findElement.MozMillElement("Elem", this._controller.window);
          var cmdKey = utils.getEntity(this.dtds, "newTab2.key");
          win.keypress(cmdKey, {accelKey: true});
          break;
        case "sidebarButton":
          var sideNewTab = this.getElement({type: "sidebar_newTabButton"});
          sideNewTab.tap();
          break;
        default:
          throw new Error("Unknown event type - " + type);
      }

      assert.waitFor(function () {
        return self.opened && self.animationend;
      }, "New tab has been opened");
    }
    finally {
      this._controller.window.removeEventListener("TabOpen", checkTabOpened);
      this._root.getNode().removeEventListener("animationend", checkTabAnimationEnd);
    }
  },

  /**
   * Close all tabs of the window and open a blank tab
   */
  closeAllTabs : function tabBrowser_closeAllTabs() {
    while (this.length > 1) {
      this.closeTab();
    }

    this._controller.open(this._controller.window.BROWSER_NEW_TAB_URL);
    this._controller.waitForPageLoad();
  },

  /**
   * Close an open tab
   *
   * @param {String} [aEventType="shortcut"]
   *        Type of event which triggers the action
   * @param {Number} [aIndex=selectedIndex]
   *        Index of the tab to close
   */
  closeTab : function tabBrowser_closeTab(aEventType, aIndex) {
    var type = aEventType || "shortcut";

    // Add event listeners to wait until the tab has been closed
    var self = {
      closed: false,
      animationend: false
    };

    function checkTabClosed() { self.closed = true; }
    function checkTabAnimationEnd() { self.animationend = true; }

    this._controller.window.addEventListener("TabClose", checkTabClosed, false);
    this._root.getNode().addEventListener("animationend", checkTabAnimationEnd);

    if (aIndex !== undefined) {
      this.selectedIndex = aIndex;
    }

    try {
      switch (type) {
        case "button":
          var closeButton = this.getElement({type: "closeButton", value: this.getTab()});
          closeButton.click();
          break;
        case "shortcut":
          var win = new findElement.MozMillElement("Elem", this._controller.window);
          var cmdKey = utils.getEntity(this.dtds, "closeTab.key");
          win.keypress(cmdKey, {accelKey: true});
          break;
        default:
          throw new Error("Unknown event type - " + type);
      }

      assert.waitFor(function () {
        return self.closed && self.animationend;
      }, "Tab has been closed");
    }
    finally {
      this._controller.window.removeEventListener("TabClose", checkTabClosed, false);
      this._root.getNode().removeEventListener("animationend", checkTabAnimationEnd);
    }
  }
};

exports.TabBrowser = TabBrowser;
