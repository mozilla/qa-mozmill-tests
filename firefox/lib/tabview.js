/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var { assert } = require("../../lib/assertions");
var domUtils = require("../../lib/dom-utils");
var tabs = require("tabs");
var utils = require("../../lib/utils");

/**
 * Constructor
 */
function tabView(aController) {
  this._controller = aController;
  this._tabView = null;
  this._tabViewDoc = this._controller.window.document;
  this._tabViewObject = this._controller.window.TabView;
}

/**
 * Tab View class
 */
tabView.prototype = {

  ///////////////////////////////
  // Global section
  ///////////////////////////////

  /**
   * Returns the MozMill controller
   *
   * @returns Mozmill controller
   * @type {MozMillController}
   */
  get controller() {
    return this._controller;
  },

  /**
   * Returns an array of DTDs
   *
   * @returns {Array} An array of DTDs
   */
  get dtds() {
    var dtds = [
      "chrome://browser/locale/browser.dtd"
    ];

    return dtds;
  },

  /**
   * Check if the Tab View is open
   *
   * @returns True if the Tab View is open
   * @type {boolean}
   */
  get isOpen() {
    var deck = this.getElement({type: "deck"});
    return deck.getNode().getAttribute("selectedIndex") == "1";
  },

  /**
   * Open the Tab View
   */
  open : function tabView_open() {
    // Add event listener to wait until the tabview has been opened
    var self = { opened: false };
    function checkOpened() { self.opened = true; }
    this._controller.window.addEventListener("tabviewshown", checkOpened);

    try {
      // Open via keyboard shortcut
      var cmdKey = utils.getEntity(this.dtds, "tabView.commandkey");
      this._controller.keypress(null, cmdKey, {accelKey: true, shiftKey: true});

      assert.waitFor(function () {
        return self.opened;
      }, "TabView has been opened.");

      this._groupItemsObject = this._tabViewObject._window.GroupItems;
      this._tabItemsObject = this._tabViewObject._window.TabItems;
    }
    finally {
      this._controller.window.removeEventListener("tabviewshown", checkOpened);
    }

    this._tabView = this.getElement({type: "tabView"});
    this._tabViewDoc = this._tabView.getNode().webNavigation.document;
  },

  /**
   * Reset the Tab View settings for the current window
   */
  reset : function tabView_reset() {
    // Make sure to close TabView before resetting its ui
    if (this.isOpen) {
      this.close();
    }

    var self = this;
    this._tabViewObject._initFrame(function () {
      var contentWindow = self._tabViewObject._window;
      contentWindow.UI.reset();
    });

    // Make sure all tabs will be shown
    Array.forEach(this._controller.window.gBrowser.tabs, function (tab) {
      this._controller.window.gBrowser.showTab(tab);
    }, this);
  },

  /**
   * Close the Tab View
   */
  close : function tabView_close() {
    // Add event listener to wait until the tabview has been closed
    var self = { closed: false };
    function checkClosed() { self.closed = true; }
    this._controller.window.addEventListener("tabviewhidden", checkClosed, false);

    try {
      // Close via keyboard shortcut
      var cmdKey = utils.getEntity(this.dtds, "tabView.commandkey");
      this._controller.keypress(null, cmdKey, {accelKey: true, shiftKey: true});

      assert.waitFor(function () {
        return self.closed;
      }, "TabView has been closed.");
    }
    finally {
      this._controller.window.removeEventListener("tabviewhidden", checkClosed, false);
    }

    this._groupItemsObject = null;
    this._tabItemsObject = null;
    this._tabView = null;
    this._tabViewDoc = this._controller.window.document;
  },


  ///////////////////////////////
  // Groups section
  ///////////////////////////////

  /**
   * Get the active group
   *
   * @returns {ElemBase} Active group element
   */
  get activeGroup() {
    return this.getGroups({filter: "active"})[0];
  },

  /**
   * Returns the tab groups which match the filter criteria
   *
   * @param {object} aSpec
   *        Information about the filter to apply
   *        Elements: filter - Type of filter to apply
   *                           (active, title)
   *                           [optional - default: ""]
   *                  value  - Value of the element
   *                           [optional - default: ""]
   *
   * @returns List of groups
   * @type {array of ElemBase}
   */
  getGroups : function tabView_getGroups(aSpec) {
    var spec = aSpec || {};

    return this.getElements({
      type: "groups",
      subtype: spec.filter,
      value: spec.value
    });
  },

  /**
   * Retrieve the group's title box
   *
   * @param {object} aSpec
   *        Information on which group to operate on
   *        Elements: group - Group element
   *
   * @returns Group title box
   * @type {ElemBase}
   */
  getGroupTitleBox : function tabView_getGroupTitleBox(aSpec) {
    var spec = aSpec || {};
    var group = spec.group;
    assert.ok(group, arguments.callee.name + ": Group has been specified.");

    return this.getElement({
      type: "group_titleBox",
      parent: group
    });
  },

  /**
   * Close the specified tab group
   *
   * @param {object} aSpec
   *        Information on which group to operate on
   *        Elements: group - Group
   */
  closeGroup : function tabView_closeGroup(aSpec) {
    var spec = aSpec || {};
    var group = spec.group;
    assert.ok(group, arguments.callee.name + ": Group has been specified.");

    var button = this.getElement({
      type: "group_closeButton",
      parent: group
    });
    this._controller.click(button);

    this.waitForGroupClosed({group: group});
  },

  /**
   * Wait until the specified tab group has been closed
   *
   * @param {object} aSpec
   *        Information on which group to operate on
   *        Elements: group - Group
   */
  waitForGroupClosed : function tabView_waitForGroupClosed(aSpec) {
    var spec = aSpec || {};
    var group = spec.group;
    var groupObj = null;

    var self = { closed: false };
    function checkClosed() { self.closed = true; }

    assert.ok(group, arguments.callee.name + ": Group has been specified.");

    this._groupItemsObject.groupItems.forEach(function (aNode) {
      if (aNode.container == group.getNode()) {
        groupObj = aNode;
      }
    });

    assert.ok(groupObj, arguments.callee.name + ": Group has been found.");

    try {
      groupObj.addSubscriber(groupObj, "groupHidden", checkClosed);
      assert.waitFor(function () {
        return self.closed;
      }, "Tab Group has not been closed.");
    }
    finally {
      groupObj.removeSubscriber(groupObj, "groupHidden");
    }
  },

  /**
   * Undo the closing of the specified tab group
   *
   * @param {object} aSpec
   *        Information on which group to operate on
   *        Elements: group - Group
   */
  undoCloseGroup : function tabView_undoCloseGroup(aSpec) {
    var spec = aSpec || {};
    var group = spec.group;
    assert.ok(group, arguments.callee.name + ": Group has been specified.");

    var undo = this.getElement({
      type: "group_undoButton",
      parent: group
    });
    this._controller.waitThenClick(undo);

    this.waitForGroupUndo({group: group});
  },

  /**
   * Wait until the specified tab group has been reopened
   *
   * @param {object} aSpec
   *        Information on which group to operate on
   *        Elements: group - Group
   */
  waitForGroupUndo : function tabView_waitForGroupUndo(aSpec) {
    var spec = aSpec || {};
    var group = spec.group;
    var groupObj = null;

    var self = { reopened: false };
    function checkClosed() { self.reopened = true; }

    assert.ok(group, arguments.callee.name + ": Group has been specified.");

    var groupObj = null;
    this._groupItemsObject.groupItems.forEach(function(aNode) {
      if (aNode.container == group.getNode()) {
        groupObj = aNode;
      }
    });

    assert.ok(groupObj, arguments.callee.name + ": Group has been found.");

    try {
      groupObj.addSubscriber(groupObj, "groupShown", checkClosed);
      assert.waitFor(function () {
        return self.reopened;
      }, "Tab Group has not been reopened.");
    }
    finally {
      groupObj.removeSubscriber(groupObj, "groupShown");
    }
  },


  ///////////////////////////////
  // Tabs section
  ///////////////////////////////

  /**
   * Returns the tabs which match the filter criteria
   *
   * @param {object} aSpec
   *        Information about the filter to apply
   *        Elements: filter - Type of filter to apply
   *                           (active, title)
   *                           [optional - default: ""]
   *                  value  - Value of the element
   *                           [optional - default: ""]
   *
   * @returns List of tabs
   * @type {array of ElemBase}
   */
  getTabs : function tabView_getTabs(aSpec) {
    var spec = aSpec || {};

    return this.getElements({
      type: "tabs",
      subtype: spec.filter,
      value: spec.value
    });
  },

  /**
   * Close a tab
   *
   * @param {object} aSpec
   *        Information about the element to operate on
   *        Elements: tab - Tab to close
   */
  closeTab : function tabView_closeTab(aSpec) {
    var spec = aSpec || {};
    var tab = spec.tab;
    assert.ok(tab, arguments.callee.name + ": Tab has been specified.");

    var button = this.getElement({
      type: "tab_closeButton",
      value: tab}
    );
    this._controller.click(button);
  },

  /**
   * Retrieve the tab's title box
   *
   * @param {object} aSpec
   *        Information on which tab to operate on
   *        Elements: tab - Tab
   *
   * @returns Tab title box
   * @type {ElemBase}
   */
  getTabTitleBox : function tabView_getTabTitleBox(aSpec) {
    var spec = aSpec || {};
    var tab = spec.tab;
    assert.ok(tab, arguments.callee.name + ": Tab has been specified.");

    return this.getElement({
      type: "tab_titleBox",
      parent: spec.tab
    });
  },

  /**
   * Open a new tab
   *
   * This will determine the current tab view to close
   *
   * @param {String} [aEventType="menu"] Type of event which triggers the action
   *   <dl>
   *     <dt>menu</dt>
   *     <dd>The main menu is used</dd>
   *     <dt>shortcut</dt>
   *     <dd>The keyboard shortcut is used</dd>
   *   </dl>
   */
  openTab : function tabView_openTab(aEventType) {
    var type = aEventType || "menu";

    // Add event listener to wait until the tabview has been closed
    var self = { closed: false };
    function checkClosed() { self.closed = true; }
    this._controller.window.addEventListener("tabviewhidden", checkClosed);

    try {
      switch (type) {
        case "menu":
          this._controller.mainMenu.click("#menu_newNavigatorTab");
          break;
        case "shortcut":
          var cmdKey = utils.getEntity(this.getDtds(), "tabCmd.commandkey");
          this._controller.keypress(null, cmdKey, {accelKey: true});
          break;
        default:
          assert.fail("Unknown event type - " + type);
      }

      assert.waitFor(function () {
        return self.closed;
      }, "TabView has been closed.");
    }
    finally {
      this._controller.window.removeEventListener("tabviewhidden", checkClosed);
    }

    this._groupItemsObject = null;
    this._tabItemsObject = null;
  },

  /**
   * Select a tab view at Index
   *
   * @param {number} aIndex
   *        Index of the tab we switch to
   * @param {string} [aFilter]
   *        Type of filter to apply
   *        (active, group)
   */
  selectTabAtIndex : function tabView_selectTabAtIndex(aIndex, aFilter) {
    var tab =  this.getTabs({filter: aFilter})[aIndex];
    assert.ok(tab.exists(), "Tab has been found.");

    // Add event listener to wait until the tabview has been changed
    var self = { hidden: false };
    function checkChanged() { self.hidden = true; }
    this._controller.window.addEventListener("tabviewhidden", checkChanged, false);

    try {
      tab.click();

      // Wait for the selected tab to display
      assert.waitFor(function () {
        return self.hidden;
      }, "TabView has been hidden.");
    }
    finally {
      this._controller.window.removeEventListener("tabviewhidden", checkChanged, false);
    }
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function tabView_getDtds() {
    var dtds = ["chrome://browser/locale/browser.dtd",
                "chrome://global/locale/global.dtd"];
    return dtds;
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
  getElement : function tabView_getElement(aSpec) {
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
  getElements : function tabView_getElement(aSpec) {
    var spec = aSpec || { };
    var type = spec.type;
    var subtype = spec.subtype;
    var value = spec.value;
    var parent = spec.parent;

    var root = parent ? parent.getNode() : this._tabViewDoc;
    var nodeCollector = new domUtils.nodeCollector(root);

    switch(type) {
      // Top level elements
      case "tabView":
        nodeCollector.root = this._controller.window.document;
        nodeCollector.queryNodes("#tab-view");
        break;
      case "contentArea":
        nodeCollector.queryNodes("#content");
        break;
      case "deck":
        nodeCollector.root = this._controller.window.document;
        nodeCollector.queryNodes("#tab-view-deck");
        break;
      case "exitButton":
        nodeCollector.queryNodes("#exit-button");
        break;

      // Group elements
      case "group_appTabs":
        nodeCollector.queryNodes(".appTabIcon");
        break;
      case "group_closeButton":
        nodeCollector.queryNodes(".close");
        break;
      case "group_resizer":
        nodeCollector.queryNodes(".iq-resizable-handle");
        break;
      case "group_stackExpander":
        nodeCollector.queryNodes(".stackExpander");
        break;
      case "group_titleBox":
        nodeCollector.queryNodes(".name");
        break;
      case "group_undoButton":
        nodeCollector.queryNodes(".undo");
        break;
      case "groups":
        nodeCollector.queryNodes(".groupItem").filter(function (aNode) {
          switch(subtype) {
            case "active":
              return aNode.className.indexOf("activeGroup") != -1;
            case "title":
              // If no title is given the default name is used
              if (!value) {
                value = utils.getProperty("chrome://browser/locale/tabview.properties",
                                          "tabview.groupItem.defaultName");
              }
              var title = aNode.querySelector(".name");
              return (value == title.value);
            default:
              return true;
          }
        }, this);
        break;

      // Search elements
      case "search_box":
        nodeCollector.queryNodes("#searchbox");
        break;
      case "search_button":
        nodeCollector.queryNodes("#searchbutton");
        break;

      // Tab elements
      case "tab_closeButton":
        nodeCollector.queryNodes(".tab .close");
        break;
      case "tab_favicon":
        nodeCollector.queryNodes(".tab .favicon");
        break;
      case "tab_titleBox":
        nodeCollector.queryNodes(".tab .tab-title");
        break;
      case "tabs":
        nodeCollector.queryNodes(".tab").filter(function (aNode) {
          switch (subtype) {
            case "active":
              return (aNode.className.indexOf("focus") != -1);
            case "group":
              var group = value ? value.getNode() : null;
              if (group) {
                var tabs = this._tabItemsObject.getItems();
                for (var i = 0; i < tabs.length; i++) {
                  var tab = tabs[i];
                  if (tab.parent && tab.parent.container == group) {
                    return true;
                  }
                }
                return false;
              }
              else {
                return (aNode.className.indexOf("tabInGroupItem") == -1);
              }
            default:
              return true;
          }
        }, this);
        break;
      default:
        assert.fail("Unknown element type - " + aSpec.type);
    }

    return nodeCollector.elements;
  }
}

// Export of classes
exports.tabView = tabView;
