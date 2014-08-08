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
 * @param {MozmillController} aController
 *        MozMillController of the window to operate on
 */
function autoCompleteResults(aController) {
  this._controller = aController;
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
   * @param {ElemBase} aResult
   *        Autocomplete result which has to be checked
   * @param {string} aType
   *        Type of element to check (text or url)
   *
   * @returns An array of substrings which are underlined
   * @type {Array of string}
   */
  getUnderlinedText : function autoCompleteResults_getUnderlinedText(aResult, aType) {
    assert.notEqual(aResult.getNode(), null, "Result is not null");

    // Get the description element of the given title or url
    var description = null;
    switch (aType) {
      case "title":
        description = aResult.getNode().boxObject.firstChild.childNodes[1].childNodes[0];
        break;
      case "url":
        description = aResult.getNode().boxObject.lastChild.childNodes[2].childNodes[0];
        break;
      default:
        assert.fail("Type unknown - " + aType);
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
   * @param {number} aIndex
   *        Index of the result to return
   *
   * @returns Autocomplete result element
   * @type {ElemBase}
   */
  getResult : function autoCompleteResults_getResult(aIndex) {
    return this.getElement({type: "result", value: aIndex});
  },

  /**
   * Close the autocomplete popup
   *
   * @param {boolean} aForce
   *        Force the closing of the autocomplete popup
   */
  close : function autoCompleteResults_close(aForce) {
    if (this.isOpened) {
      if (aForce) {
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
 * @param {MozmillController} aController
 *        MozMillController of the window to operate on
 */
function editBookmarksPanel(aController) {
  this._controller = aController;
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
   * Retrieve an UI element based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   *        type: General type information
   *        subtype: Specific element or property
   *        value: Value of the element or property
   * @returns Element which has been created
   * @type ElemBase
   */
  getElement : function editBookmarksPanel_getElement(aSpec) {
    var elem = null;

    switch(aSpec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
      case "bookmarkPanel":
        elem = new elementslib.ID(this._controller.window.document, "editBookmarkPanel");
        break;
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
        assert.fail("Unknown element type - " + aSpec.type);
    }

    return elem;
  }
}

/**
 * Identity popup (from location bar) class
 * @constructor
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function IdentityPopup(aController) {
  assert.ok(aController, "A controller has to be specified");

  this._controller = aController;
  this._popup = this.getElement({type: "popup"});
}

IdentityPopup.prototype = {
  /**
   * Get the controller of the window
   *
   * @returns {MozMillController} Mozmill Controller
   */
  get controller() {
    return this._controller;
  },

  /**
   * Check if the identity popup is open
   *
   * @returns {boolean} True if the panel is open, false otherwise
   */
  get isOpen() {
    return this._popup.getNode().state === "open";
  },

  /**
   * Retrieve an UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   * @parma {string} aSpec.type
   *        Identifier of the element
   *
   * @returns {ElemBase} Element which has been found
   */
  getElement : function IdentityPopup_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   * @parma {string} aSpec.type
   *        Identifier of the element
   *
   * @returns {ElemBase[]} Elements which have been found
   */
  getElements : function IdentityPopup_getElements(aSpec) {
    var spec = aSpec || { };
    var elem = null;
    var parent = this._controller.window.document;

    switch (spec.type) {
      case "box":
        elem = findElement.ID(parent, "identity-box");
        break;
      case "countryLabel":
        elem = findElement.ID(parent, "identity-icon-country-label");
        break;
      case "encryptionLabel":
        elem = findElement.ID(parent, "identity-popup-encryption-label");
        break;
      case "encryptionIcon":
        elem = findElement.ID(parent, "identity-popup-encryption-icon");
        break;
      case "host":
        elem = findElement.ID(parent, "identity-popup-content-host");
        break;
      case "moreInfoButton":
        elem = findElement.ID(parent, "identity-popup-more-info-button");
        break;
      case "organizationLabel":
        elem = findElement.ID(parent, "identity-icon-label");
        break;
      case "owner":
        elem = findElement.ID(parent, "identity-popup-content-owner");
        break;
      case "ownerLocation":
        elem = findElement.ID(parent, "identity-popup-content-supplemental");
        break;
      case "popup":
        elem = findElement.ID(parent, "identity-popup");
        break;
      case "permissions":
        elem = findElement.ID(parent, "identity-popup-permissions");
        break;
      case "verifier":
        elem = findElement.ID(parent, "identity-popup-content-verifier");
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return [elem];
  }
}

/**
 * Constructor
 *
 * @param {MozmillController} aController
 *        MozMillController of the window to operate on
 */
function locationBar(aController) {
  assert.ok(aController, "A controller has to be specified");

  this._controller = aController;
  this._autoCompleteResults = new autoCompleteResults(aController);
  this._editBookmarksPanel = new editBookmarksPanel(aController);
  this._identityPopup = new IdentityPopup(aController);
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
   * Returns the identity popup object
   *
   * @returns {object} Identity popup instance
   */
  get identityPopup() {
    return this._identityPopup;
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
   * @param {string} aText
   *        Text which should be checked against
   */
  contains : function locationBar_contains(aText) {
    return this.urlbar.getNode().value.indexOf(aText) != -1;
  },

  /**
   * Focus the location bar
   *
   * @param {object} aEvent
   *        Focus the location bar with the given event (click or shortcut)
   */
  focus : function locationBar_focus(aEvent) {
    switch (aEvent.type) {
      case "click":
        this._controller.click(this.urlbar);
        break;
      case "shortcut":
        var cmdKey = utils.getEntity(this.getDtds(), "openCmd.commandkey");
        this._controller.keypress(null, cmdKey, {accelKey: true});
        break;
      default:
        assert.fail("Unkown event type - " + aEvent.type);
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
      case "notificationPopup_buttonMenu":
        nodeCollector.queryAnonymousNode("anonid", "menupopup");
        break;
      case "notificationPopup_menuItem":
        nodeCollector.queryNodes("menuitem").filterByDOMProperty(spec.subtype,
                                                                 spec.value);
        break;
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
   * @param {string} aUrl
   *        URL of web page to load
   */
  loadURL : function locationBar_loadURL(aUrl) {
    this.focus({type: "shortcut"});
    this.type(aUrl);
    this._controller.keypress(this.urlbar, "VK_RETURN", {});
  },

  /**
   * Reload the currently open web page
   *
   * @param {object} aSpec
   *        Information for the reload event
   * @param {string} [aSpec.eventType="shortcut"]
   *        Type of event which triggers the action
   * @param {boolean} [aSpec.aForce=false]
   *        Value if the reload will be forced
   */
  reload : function locationBar_reload(aSpec) {
    var spec = aSpec || {};
    var type = spec.eventType || "shortcut";
    var forceReload = !!spec.aForce;
    var urlbar = this.getElement({type: "urlbar"});

    switch (type) {
      case "button":
        var reloadButton = this.getElement({type: "reloadButton"});
        // Bug 980794
        // Extend the new mouse events to accept modifier keys
        // Once fixed, replace this with the standard click() event
        reloadButton.mouseEvent(undefined, undefined, {
          clickCount: 1,
          shiftKey: forceReload
        });
        break;
      case "shortcut":
        var cmdKey = utils.getEntity(this.getDtds(), "reloadCmd.commandkey");
        urlbar.keypress(cmdKey, {accelKey: true, shiftKey: forceReload});
        break;
      case "shortcut2":
        urlbar.keypress("VK_F5", {shiftKey: forceReload});
        break;
      default:
        throw new Error("Unknown event type - " + type);
    }
  },

  /**
   * Type the given text into the location bar
   *
   * @param {string} aText
   *        Text to enter into the location bar
   */
  type : function locationBar_type(aText) {
    this._controller.type(this.urlbar, aText);
  },

  /**
   * Bookmark a page
   * Also waits for the animation event that occurs to finish
   *
   * @param {function} aCallback
   *        Function to trigger page bookmarking event
   */
  bookmarkWithAnimation : function locationBar_bookmarkWithAnimation(aCallback) {
    var self = { started: false, ended: false };
    var bookmarksMenuButton = this.getElement({type: "bookmarksMenuButton"});
    var window = this._controller.window.document.defaultView;

    var mutationObserver = new window.MutationObserver(function (aMutations) {
      aMutations.forEach(function (aMutation) {
        // For changing the CSS style and enabling the button there's a different
        // action besides animationend event
        // We have to wait until the attribute has been added then removed

        if (!self.started) {
          self.started = (aMutation.target.getAttribute("notification") === "finish");
        }
        else {
          self.ended = !aMutation.target.hasAttribute("notification");
        }
      });
    });
    try {
      mutationObserver.observe(bookmarksMenuButton.getNode(),
                               {attributes: true, attributeFilter: ["notification"]});
      aCallback();
      assert.waitFor(() => self.ended);
    }
    finally {
      mutationObserver.disconnect();
    }
  },

  /**
   * Waits for the given notification popup
   *
   * @param {function} aCallback
   *        Function that triggers the panel to open/close
   * @param {object} aSpec
   *        Information related to the notification to wait for
   * @param {boolean} [aSpec.open=true]
   *        True if the notification should be open
   * @param {string} aSpec.type
   *        Type of notification panel
   */
  waitForNotificationPanel : function locationBar_waitForNotificationPanel(aCallback, aSpec) {
    var spec = aSpec || {};

    assert.equal(typeof aCallback, "function", "Callback function is defined");
    assert.ok(spec.type, "Type of the notification panel is mandatory");

    var open = (spec.open == undefined) ? true : spec.open;
    var eventType = open ? "popupshown" : "popuphidden";
    var state = open ? "open" : "closed";
    var panel = null;

    switch (spec.type) {
      case "notification":
        panel = this.getElement({type: "notification_popup"});
        break;
      case "bookmark":
        panel = this._editBookmarksPanel.getElement({type: "bookmarkPanel"});
        break;
      case "identity":
        panel = this._identityPopup.getElement({type: "popup"});
        break;
      default :
        assert.fail("Unknown notification panel to wait for: " + spec.type);
    }

    // Bug 994117
    // Transitions are not handled correctly
    // Add waiting for transition events once they get fixed
    panel.getNode().setAttribute("animate", "false");
    var panelStateChanged = false;

    function onPanelState() { panelStateChanged = true; }

    panel.getNode().addEventListener(eventType, onPanelState);
    try {
      aCallback(panel);

      assert.waitFor(() => {
        return panelStateChanged;
      }, "Notification popup state has been " + (open ? "opened" : "closed"));
    }
    finally {
      panel.getNode().removeEventListener(eventType, onPanelState);
      panel.getNode().removeAttribute("animate");
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
