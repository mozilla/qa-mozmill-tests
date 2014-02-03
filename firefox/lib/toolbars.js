/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The ToolbarAPI adds support for accessing and interacting with toolbar elements
 *
 * @version 1.0.0
 */

// Include required modules
var { assert } = require("../../lib/assertions");
var domUtils = require("../../lib/dom-utils");
var utils = require("utils");

/**
 * Constructor
 *
 * @param {MozmillController} controller
 *        MozMillController of the window to operate on
 */
function autoCompleteResults(controller) {
  this._controller = controller;
  this._popup = this.getElement({type: "popup"});
  this._results = this.getElement({type: "results"});
}

/**
 * AutoComplete Result class
 */
autoCompleteResults.prototype = {
  /**
   * Returns all autocomplete results
   *
   * @returns Autocomplete results
   * @type {Array of ElemBase}
   */
  get allResults() {
    var results = [];
    for (ii = 0; ii < this.length; ii++) {
      results.push(this.getResult(ii));
    }
    return results;
  },

  /**
   * Returns the controller of the current window
   *
   * @returns Mozmill Controller
   * @type MozMillController
   */
  get controller() {
    return this._controller;
  },

  /**
   * Check if the autocomplete popup is open
   *
   * @returns True if the panel is open
   * @type {boolean}
   */
  get isOpened() {
    return (this._popup.getNode().state == 'open');
  },

  /**
   * Return the amount of autocomplete entries
   *
   * @returns Number of all entries
   * @type {number}
   */
  get length() {
    return this._results.getNode().itemCount;
  },

  /**
   * Returns the currently selected index
   *
   * @returns Selected index
   * @type {number}
   */
  get selectedIndex() {
    return this._results.getNode().selectedIndex;
  },

  /**
   * Returns the visible autocomplete results
   *
   * @returns Results
   * @type {Array of ElemBase}
   */
  get visibleResults() {
    var results = [];
    for (ii = 0; ii < this.length; ii++) {
      var result = this.getResult(ii);
      if (!result.getNode().hasAttribute("collapsed"))
        results.push(result);
    }
    return results;
  },

  /**
   * Returns the underlined text of all results from the text or URL
   *
   * @param {ElemBase} result
   *        Autocomplete result which has to be checked
   * @param {string} type
   *        Type of element to check (text or url)
   *
   * @returns An array of substrings which are underlined
   * @type {Array of string}
   */
  getUnderlinedText : function autoCompleteResults_getUnderlinedText(result, type) {
    assert.notEqual(result.getNode(), null, "Result is not null");

    // Get the description element of the given title or url
    var description = null;
    switch (type) {
      case "title":
        description = result.getNode().boxObject.firstChild.childNodes[1].childNodes[0];
        break;
      case "url":
        description = result.getNode().boxObject.lastChild.childNodes[2].childNodes[0];
        break;
      default:
        assert.fail("Type unknown - " + type);
    }

    let values = [ ];
    for each (node in description.childNodes) {
      if (node.nodeName == 'span') {
        // Only add underlined text to the results
        values.push(node.innerHTML);
      }
    }

    return values;
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function autoCompleteResults_getDtds() {
    return null;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @config {string}  type      - General type information
   * @config {string}  [subtype] - Attribute of the element to filter
   * @config {string}  [value]   - Value of the element or property
   * @config {element} [parent]  - Parent of the to find element
   *
   * @returns Element which has been found
   * @type {ElemBase}
   */
  getElement : function autoCompleteResults_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @config {string}  type      - General type information
   * @config {string}  [subtype] - Attribute of the element to filter
   * @config {string}  [value]   - Value of the element or property
   * @config {element} [parent]  - Parent of the to find element
   *
   * @returns Elements which have been found
   * @type {array of ElemBase}
   */
  getElements : function autoCompleteResults_getElements(aSpec) {
    var spec = aSpec || {};

    var root = spec.parent ? spec.parent.getNode() : this._controller.window.document;
    var nodeCollector = new domUtils.nodeCollector(root);

    switch (spec.type) {
      case "popup":
        nodeCollector.queryNodes("#PopupAutoCompleteRichResult");
        break;
      case "results":
        nodeCollector.root = this.getElement({type: "popup"}).getNode();
        nodeCollector.queryAnonymousNode("anonid", "richlistbox");
        break;
      case "result":
        var elem = new elementslib.Elem(this.getElement({type: "results"}).
                                        getNode().getItemAtIndex(spec.value));
        return [elem];
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return nodeCollector.elements;
  },

  /**
   * Returns the autocomplete result element of the given index
   *
   * @param {number} index
   *        Index of the result to return
   *
   * @returns Autocomplete result element
   * @type {ElemBase}
   */
  getResult : function autoCompleteResults_getResult(index) {
    return this.getElement({type: "result", value: index});
  },

  /**
   * Close the autocomplete popup
   *
   * @param {boolean} force
   *        Force the closing of the autocomplete popup
   */
  close : function autoCompleteResults_close(force) {
    if (this.isOpened) {
      if (force) {
        this._popup.getNode().hidePopup();
      }
      else {
        this._controller.keypress(locationBar.urlbar, "VK_ESCAPE", {});
      }
      assert.waitFor(function () {
          return !this.isOpened;
      }, "Autocomplete list should not be open.");
    }
  }
}

/**
 * Constructor
 *
 * @param {MozmillController} controller
 *        MozMillController of the window to operate on
 */
function editBookmarksPanel(controller) {
  this._controller = controller;
}

/**
 * Edit Bookmarks Panel class
 */
editBookmarksPanel.prototype = {
  /**
   * Get the controller of the window
   *
   * @returns {MozMillController} Mozmill Controller
   */
  get controller() {
    return this._controller;
  },

  /**
   * Wait for Edit Bookmarks Panel to load
   *
   * @param {object} aSpec
   *        Object with parameters for customization
   *        Elements: timeout - Duration to wait for the target state
   *                            [optional - default: 5s]
   */
  waitForPanel: function editBookmarksPanel_waitForPanel(aSpec) {
    var spec = aSpec || { };
    var timeout = spec.timeout;

    assert.waitFor(function () {
      return this._controller.window.top.StarUI._overlayLoaded;
    }, "Edit Bookmarks Panel has been opened", timeout, undefined, this);
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} spec
   *        Information of the UI element which should be retrieved
   *        type: General type information
   *        subtype: Specific element or property
   *        value: Value of the element or property
   * @returns Element which has been created
   * @type ElemBase
   */
  getElement : function editBookmarksPanel_getElement(spec) {
    var elem = null;

    switch(spec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
      case "doneButton":
        elem = new elementslib.ID(this._controller.window.document, "editBookmarkPanelDoneButton");
        break;
      case "folderExpander":
        elem = new elementslib.ID(this._controller.window.document, "editBMPanel_foldersExpander");
        break;
      case "folderList":
        elem = new elementslib.ID(this._controller.window.document, "editBMPanel_folderMenuList");
        break;
      case "nameField":
        elem = new elementslib.ID(this._controller.window.document, "editBMPanel_namePicker");
        break;
      case "removeButton":
        elem = new elementslib.ID(this._controller.window.document, "editBookmarkPanelRemoveButton");
        break;
      case "tagExpander":
        elem = new elementslib.ID(this._controller.window.document, "editBMPanel_tagsSelectorExpander");
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return elem;
  }
}

/**
 * Constructor
 *
 * @param {MozmillController} controller
 *        MozMillController of the window to operate on
 */
function locationBar(controller) {
  this._controller = controller;
  this._autoCompleteResults = new autoCompleteResults(controller);
  this._editBookmarksPanel = new editBookmarksPanel(controller);
}

/**
 * Location Bar class
 */
locationBar.prototype = {
  /**
   * Returns the autocomplete object
   *
   * @returns Autocomplete object
   * @type {object}
   */
  get autoCompleteResults() {
    return this._autoCompleteResults;
  },

  /**
   * Returns the edit bookmarks panel object
   *
   * @returns editBookmarksPanel object
   * @type {object}
   */
  get editBookmarksPanel() {
    return this._editBookmarksPanel;
  },

  /**
   * Returns the controller of the current window
   *
   * @returns Mozmill controller
   * @type {MozMillController}
   */
  get controller() {
    return this._controller;
  },

  /**
   * Returns the urlbar element
   *
   * @returns URL bar
   * @type {ElemBase}
   */
  get urlbar() {
    return this.getElement({type: "urlbar"});
  },

  /**
   * Returns the currently shown URL
   *
   * @returns Text inside the location bar
   * @type {string}
   */
  get value() {
    return this.urlbar.getNode().value;
  },

  /**
   * Clear the location bar
   */
  clear : function locationBar_clear() {
    this.focus({type: "shortcut"});
    this._controller.keypress(this.urlbar, "VK_DELETE", {});

    assert.waitFor(function () {
      return this.urlbar.getNode().value === '';
    }, "Location bar has been cleared.", undefined, undefined, this);
  },

  /**
   * Close the context menu of the urlbar input field
   */
  closeContextMenu : function locationBar_closeContextMenu() {
    var menu = this.getElement({type: "contextMenu"});
    this._controller.keypress(menu, "VK_ESCAPE", {});
  },

  /**
   * Check if the location bar contains the given text
   *
   * @param {string} text
   *        Text which should be checked against
   */
  contains : function locationBar_contains(text) {
    return this.urlbar.getNode().value.indexOf(text) != -1;
  },

  /**
   * Focus the location bar
   *
   * @param {object} event
   *        Focus the location bar with the given event (click or shortcut)
   */
  focus : function locationBar_focus(event) {
    switch (event.type) {
      case "click":
        this._controller.click(this.urlbar);
        break;
      case "shortcut":
        var cmdKey = utils.getEntity(this.getDtds(), "openCmd.commandkey");
        this._controller.keypress(null, cmdKey, {accelKey: true});
        break;
      default:
        assert.fail("Unkown event type - " + event.type);
    }

    // Wait until the location bar has been focused
    assert.waitFor(function () {
      return this.urlbar.getNode().getAttribute('focused') === 'true';
    }, "Location bar has been focused", undefined, undefined, this);
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function locationBar_getDtds() {
    var dtds = ["chrome://branding/locale/brand.dtd",
                "chrome://browser/locale/browser.dtd"];
    return dtds;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @config {string}  type      - General type information
   * @config {string}  [subtype] - Attribute of the element to filter
   * @config {string}  [value]   - Value of the element or property
   * @config {element} [parent]  - Parent of the to find element
   *
   * @returns Element which has been found
   * @type {ElemBase}
   */
  getElement : function locationBar_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @config {string}  type      - General type information
   * @config {string}  [subtype] - Attribute of the element to filter
   * @config {string}  [value]   - Value of the element or property
   * @config {element} [parent]  - Parent of the to find element
   *
   * @returns Elements which have been found
   * @type {array of ElemBase}
   */
  getElements : function locationBar_getElements(aSpec) {
    var spec = aSpec || {};

    var root = spec.parent ? spec.parent.getNode() : this._controller.window.document;
    var nodeCollector = new domUtils.nodeCollector(root);

    switch(spec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
      case "bookmarksMenuButton":
        return [new elementslib.ID(root, "bookmarks-menu-button")];
      case "contextMenu":
        nodeCollector.root = this.getElement({type: "urlbar_input"}).getNode().parentNode;
        nodeCollector.queryAnonymousNode("anonid", "input-box-contextmenu");
        break;
      case "contextMenu_entry":
        nodeCollector.root = this.getElement({type: "contextMenu"}).getNode();
        nodeCollector.queryNodes("menuitem").filterByDOMProperty("cmd",
                                                                 "cmd_" + spec.subtype);
        break;
      case "favicon":
        return [new elementslib.ID(root, "page-proxy-favicon")];
      case "feedButton":
        return [new elementslib.ID(root, "feed-button")];
      case "goButton":
        return [new elementslib.ID(root, "urlbar-go-button")];
      case "historyDropMarker":
        nodeCollector.root = this.getElement({type: "urlbar"}).getNode();
        nodeCollector.queryAnonymousNode("anonid", "historydropmarker");
        break;
      case "identityBox":
        return [new elementslib.ID(root, "dentity-box")];
      case "identityPopup":
        return [new elementslib.ID(root, "identity-popup-encryption")];
      case "notification_element":
        nodeCollector.queryNodes("#" + spec.subtype);
        break;
      case "notificationIcon":
        return [new elementslib.ID(root, spec.subtype + "-notification-icon")];
      case "notification_popup":
        return [new elementslib.ID(root, "notification-popup")];
      case "reloadButton":
        return [new elementslib.ID(root, "urlbar-reload-button")];
      case "starButton":
        if (utils.australis.isAustralis()) {
          nodeCollector.root = this.getElement({type: "bookmarksMenuButton"}).getNode();
          nodeCollector.queryAnonymousNode("anonid", "button");
          break;
        }

        return [new elementslib.ID(root, "star-button")];
      case "stopButton":
        return [new elementslib.ID(root, "urlbar-stop-button")];
      case "urlbar":
        return [new elementslib.ID(root, "urlbar")];
      case "urlbar_input":
        nodeCollector.root = this.getElement({type: "urlbar"}).getNode();
        nodeCollector.queryAnonymousNode("anonid", "input");
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return nodeCollector.elements;
  },

  /**
   * Retrieves the notification popup
   *
   * @return The notification popup element
   * @type {ElemBase}
   */
  getNotification : function locationBar_getNotification() {
    return this.getElement({type: "notification_popup"});
  },

  /**
   * Retrieves the specified element of the door hanger notification bar
   *
   * @param {string} aType
   *        Type of the notification bar to look for
   * @param {object} [aChildElement=""]
   *        Configuration of child element to retrieve from notification element
   * @config {string} [type]  Type of attribute of child we are looking for
   * @config {string} [value] Value of attribute of child we are looking for
   *
   * @return The found element
   * @type {ElemBase}
   */
  getNotificationElement : function locationBar_getNotificationElement(aType, aChildElement) {
    var notification = this.getElement({type: "notification_element",
                                       subtype: aType,
                                       parent: this.getNotification()});
    if (!aChildElement)
      return notification;

    var nodeCollector = new domUtils.nodeCollector(notification.getNode());
    nodeCollector.queryAnonymousNode(aChildElement.type, aChildElement.value);

    return nodeCollector.elements[0];
  },

  /**
   * Load the given URL
   *
   * @param {string} url
   *        URL of web page to load
   */
  loadURL : function locationBar_loadURL(url) {
    this.focus({type: "shortcut"});
    this.type(url);
    this._controller.keypress(this.urlbar, "VK_RETURN", {});
  },

  /**
   * Type the given text into the location bar
   *
   * @param {string} text
   *        Text to enter into the location bar
   */
  type : function locationBar_type(text) {
    this._controller.type(this.urlbar, text);
  },

  /**
   * Waits for the given notification popup
   *
   * @param {String} aElement
   *        Notification element to wait for
   * @param {Boolean} [aState=false]
   *        True if the notification should be open
   * @param {Object} [aIcon=undefined]
   *        Icon linked to the notification
   */
  waitForNotification : function locationBar_waitForNotification(aElement, aState, aIcon) {
    var notification = this.getElement({type: aElement});
    assert.waitFor(function () {
      return notification.getNode().state === (!!aState ? 'open' : 'closed');
    }, "Notification popup visibility state has been changed");

    if (aIcon) {
      elem = this.getElement({type: "notificationIcon", subtype: aIcon});
      assert.ok(elem.getNode(), "The notification icon has been found");
    }
  }
}

/**
 * Toogle bookmarks toolbar
 *
 * @param {MozmillController} aController
 *        MozMillController of the window to operate on
 * @param {Boolean} aState
 *        Expected state of the BookmarksToolbar
 */
function toggleBookmarksToolbar(aController, aState) {
  var navbar = new elementslib.ID(aController.window.document, "nav-bar");

  aController.rightClick(navbar, navbar.getNode().boxObject.width / 2, 2);

  var toggle = new elementslib.ID(aController.window.document,
                                  "toggle_PersonalToolbar");
  aController.mouseDown(toggle);
  aController.mouseUp(toggle);

  // Check that the Bookmark toolbar is in the correct state
  var state = !!aState;
  var bookmakrsToolbar = new elementslib.ID(aController.window.document,
                                            "PersonalToolbar");
  assert.waitFor(function () {
    return bookmakrsToolbar.getNode().getAttribute("collapsed") === String(!state);
  }, "Bookmarks Toolbar has " + ((state) ? "opened" : "closed"));
}

// Export of classes
exports.locationBar = locationBar;
exports.editBookmarksPanel = editBookmarksPanel;
exports.autoCompleteResults = autoCompleteResults;

// Export of functions
exports.toggleBookmarksToolbar = toggleBookmarksToolbar;
