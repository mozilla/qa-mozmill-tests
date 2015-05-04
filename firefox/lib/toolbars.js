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
var search = require("search");
var utils = require("../../lib/utils");

/**
 * Auto Complete Results class
 *
 * @constructor
 * @param {object} aBrowserWindow
 *        Browser window the results are part of
 */
function autoCompleteResults(aBrowserWindow) {
  assert.ok(aBrowserWindow, "A browser window has been defined");

  this._browserWindow = aBrowserWindow;
  this._popup = this.getElement({type: "popup"});
  this._results = this.getElement({type: "results"});
}

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
   * Get the Browser Window
   *
   * @returns {object} The browser window where the popup lives
   */
  get browserWindow() {
    return this._browserWindow;
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

    var root = spec.parent ? spec.parent.getNode()
                           : this.browserWindow.controller.window.document;
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
        var elem = findElement.Elem(this.getElement({type: "results"}).
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
        this.browserWindow.controller.keypress(locationBar.urlbar, "VK_ESCAPE", {});
      }
      assert.waitFor(function () {
          return !this.isOpened;
      }, "Autocomplete list should not be open.");
    }
  }
}

/**
 * Downloads Panel class
 *
 * @constructor
 * @param {object} aBrowserWindow
 *        Browser window the downloads panel is part of
 */
function DownloadsPanel(aBrowserWindow) {
  assert.ok(aBrowserWindow, "Browser Window has been defined");

  this._browserWindow = aBrowserWindow;
  this._panel = this.getElement({type: "panel"});
}

DownloadsPanel.prototype = {
  /**
   * Get the Browser Window
   *
   * @returns {object} The browser window where the panel lives
   */
  get browserWindow() {
    return this._browserWindow;
  },

  /**
   * Check if the Downloads Panel is open
   *
   * @returns {boolean} True if the panel is open, false otherwise
   */
  get isOpen() {
    return this.panel.getNode().state === "open";
  },

  /**
   * Get the panel
   *
   * @returns {MozMillElement} The downloads panel
   */
  get panel() {
    return this._panel;
  },

  /**
   * Get the state of a download
   *
   * @param {MozMillElement} aDownload
   *        The element for which to get the state
   *
   * @returns {number} The number representing the state download is in
   */
  getDownloadStatus : function DownloadsPanel_getDownloadState(aDownload) {
    assert.ok(aDownload, "Download element has been specified");

    return parseInt(aDownload.getNode().getAttribute("state"));
  },

  /**
   * Retrieve an UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   * @parma {string} aSpec.type
   *        Identifier of the element
   * @param {string} [aSpec.subtype]
   *        Attribute of the element to filter
   * @param {string} [aSpec.value]
   *        Value of the attribute to filter
   * @param {string} [aSpec.parent=document]
   *        Parent of the to find element
   *
   * @returns {ElemBase} Element which has been found
   */
  getElement : function DownloadsPanel_getElement(aSpec) {
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
   * @param {string} [aSpec.subtype]
   *        Attribute of the element to filter
   * @param {string} [aSpec.value]
   *        Value of the attribute to filter
   * @param {string} [aSpec.parent=document]
   *        Parent of the to find element
   *
   * @returns {ElemBase[]} Elements which have been found
   */
  getElements : function DownloadsPanel_getElements(aSpec) {
    var spec = aSpec || {};

    var root = spec.parent || this.browserWindow.controller.window.document;
    var nodeCollector = new domUtils.nodeCollector(root);

    var elems = null;

    switch (spec.type) {
      case "download":
        assert.equal(typeof spec.value, "number",
                     "Download index has been specified");
        elems = [this.getElements({type: "downloads"})[spec.value]];
        break;
      case "downloads":
        nodeCollector.root = findElement.ID(root, "downloadsListBox").getNode();
        nodeCollector.queryNodes("richlistitem");
        elems = nodeCollector.elements;
        break;
      case "downloadButton":
        assert.equal(typeof spec.value, "number",
                     "Download index has been specified");
        assert.ok(spec.subtype, "Download button has been specified");

        var item = this.getElement({type: "download", value: spec.value});
        nodeCollector.root = item.getNode();
        switch (spec.subtype) {
          case "cancel":
            nodeCollector.queryAnonymousNode("class",
                                             "downloadButton downloadCancel");
            break;
          case "retry":
            nodeCollector.queryAnonymousNode("class",
                                             "downloadButton downloadRetry");
            break;
          case "show":
            nodeCollector.queryAnonymousNode("class",
                                             "downloadButton downloadShow");
            break;
          default:
            assert.fail("Unknown element subtype - " + spec.subtype);
        }
        elems = nodeCollector.elements;
        break;
      case "openButton":
        elems = [findElement.ID(root, "downloads-button")];
        break;
      case "panel":
        elems = [findElement.ID(root, "downloadsPanel")];
        break;
      case "showAllDownloads":
        elems = [findElement.ID(root, "downloadsHistory")];
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return elems;
  },

  /**
   * Close the panel
   *
   * @params {object} [aSpec={}]
   *         Information on how to close the panel
   * @params {string} [aSpec.method="shortcut"]
   *         Method to use to close the downloads panel ("callback", "shortcut")
   * @params {function} [aSpec.callback]
   *         Callback that triggers the download panel to close
   * @params {boolean} [aSpec.force=false]
   *         Force closing the Downloads Panel
   */
  close : function DownloadsPanel_close(aSpec={}) {
    var method = aSpec.method || "shortcut";

    if (this.panel.getNode().state === "closed" && aSpec.force) {
      return;
    }

    waitForNotificationPanel(() => {
      if (aSpec.force && this.panel.getNode()) {
        this.panel.getNode().hidePopup();
        return;
      }

      switch (method) {
        case "callback":
          assert.equal(aSpec.callback, "function",
                       "Callback has been defined");
          aSpec.callback();
          break;
        case "shortcut":
          this.panel.keypress("VK_ESCAPE", {});
          break;
        default:
          assert.fail("Unknown method to open the downloads panel - " + method);
      }
    }, {panel: this.panel, open: false});
  },

  /**
   * Open the downloads panel
   *
   * @params {object} [aSpec={}]
   *         Information about the panel to open
   * @params {string} [aSpec.method="button"]
   *         Method to use for opening the Downloads Panel ("button", "callback")
   * @params {function} [aSpec.callback]
   *         Callback that triggers the opening
   */
  open : function DownloadsPanel_open(aSpec={}) {
    var method = aSpec.method || "button";

    waitForNotificationPanel(() => {
      switch (method) {
        case "button":
          var button = this.getElement({type: "openButton"});
          button.click();
          break;
        case "callback":
          assert.equal(typeof aSpec.callback, "function",
                       "Callback has been defined");
          aSpec.callback();
          break;
        default:
          assert.fail("Unknown method for opening the downloads panel - " + method);
      }
    }, {panel: this.panel, open: true});
  }
}

/**
 * Edit Bookmarks Panel class
 *
 * @constructor
 * @param {object} aBrowserWindow
 *        Browser window the panel is part of
 */
function editBookmarksPanel(aBrowserWindow) {
  assert.ok(aBrowserWindow, "A browser window has been defined");

  this._browserWindow = aBrowserWindow;
}

/**
 * Edit Bookmarks Panel class
 */
editBookmarksPanel.prototype = {
  /**
   * Get the Browser Window
   *
   * @returns {object} The browser window where the popup lives
   */
  get browserWindow() {
    return this._browserWindow;
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
    var parent = this.browserWindow.controller.window.document;

    switch(aSpec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
      case "bookmarkPanel":
        elem = findElement.ID(parent, "editBookmarkPanel");
        break;
      case "doneButton":
        elem = findElement.ID(parent, "editBookmarkPanelDoneButton");
        break;
      case "folderExpander":
        elem = findElement.ID(parent, "editBMPanel_foldersExpander");
        break;
      case "folderList":
        elem = findElement.ID(parent, "editBMPanel_folderMenuList");
        break;
      case "nameField":
        elem = findElement.ID(parent, "editBMPanel_namePicker");
        break;
      case "removeButton":
        elem = findElement.ID(parent, "editBookmarkPanelRemoveButton");
        break;
      case "tagExpander":
        elem = findElement.ID(parent, "editBMPanel_tagsSelectorExpander");
        break;
      default:
        assert.fail("Unknown element type - " + aSpec.type);
    }

    return elem;
  }
}

/**
 * Identity Popup class
 *
 * @constructor
 * @param {object} aBrowserWindow
 *        Browser window the identity popup is part of
 */
function IdentityPopup(aBrowserWindow) {
  assert.ok(aBrowserWindow, "A browser window has been defined");

  this._browserWindow = aBrowserWindow;
  this._popup = this.getElement({type: "popup"});
}

IdentityPopup.prototype = {
  /**
   * Get the Browser Window
   *
   * @returns {object} The browser window where the popup lives
   */
  get browserWindow() {
    return this._browserWindow;
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
    var parent = this.browserWindow.controller.window.document;

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
 * Location Bar class
 *
 * @constructor
 * @param {object} aBrowserWindow
 *        Browser window the location bar is part of
 */
function locationBar(aBrowserWindow) {
  assert.ok(aBrowserWindow, "Browser window has been defined");

  this._browserWindow = aBrowserWindow;
  this._autoCompleteResults = null;
  this._identityPopup = null;
}

/**
 * Location Bar class
 */
locationBar.prototype = {
  /**
   * Get the Browser Window
   *
   * @returns {object} The browser window where the panel lives
   */
  get browserWindow() {
    return this._browserWindow;
  },

  /**
   * Returns the autocomplete object
   *
   * @returns {object} Autocomplete instance
   */
  get autoCompleteResults() {
    if (!this._autoCompleteResults) {
      this._autoCompleteResults = new autoCompleteResults(this.browserWindow);
    }
    return this._autoCompleteResults;
  },

  /**
   * Returns the identity popup object
   *
   * @returns {object} Identity popup instance
   */
  get identityPopup() {
    if (!this._identityPopup) {
      this._identityPopup = new IdentityPopup(this.browserWindow);
    }
    return this._identityPopup;
  },

  /**
   * Returns the urlbar element
   *
   * @returns {ElemBase} URL bar
   */
  get urlbar() {
    return this.getElement({type: "urlbar"});
  },

  /**
   * Returns the currently shown URL
   *
   * @returns {string} Text inside the location bar
   */
  get value() {
    return this.urlbar.getNode().value;
  },

  /**
   * Clear the location bar
   */
  clear : function locationBar_clear() {
    this.focus({type: "shortcut"});
    this.urlbar.keypress("VK_DELETE", {});

    assert.waitFor(function () {
      return this.urlbar.getNode().value === '';
    }, "Location bar has been cleared.", undefined, undefined, this);
  },

  /**
   * Close the context menu of the urlbar input field
   */
  closeContextMenu : function locationBar_closeContextMenu() {
    var menu = this.getElement({type: "contextMenu"});
    menu.keypress("VK_ESCAPE", {});
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
        this.urlbar.click();
        break;
      case "shortcut":
        var cmdKey = utils.getEntity(this.getDtds(), "openCmd.commandkey");
        this.browserWindow.controller.keypress(null, cmdKey,
                                               {accelKey: true});
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

    var root = spec.parent ? spec.parent.getNode()
                           : this.browserWindow.controller.window.document;
    var nodeCollector = new domUtils.nodeCollector(root);

    switch(spec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
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
        return [findElement.ID(root, "page-proxy-favicon")];
      case "goButton":
        return [findElement.ID(root, "urlbar-go-button")];
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
        return [findElement.ID(root, spec.subtype + "-notification-icon")];
      case "notification_popup":
        return [findElement.ID(root, "notification-popup")];
      case "reloadButton":
        return [findElement.ID(root, "urlbar-reload-button")];
      case "stopButton":
        return [findElement.ID(root, "urlbar-stop-button")];
      case "urlbar":
        return [findElement.ID(root, "urlbar")];
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
    this.urlbar.keypress("VK_RETURN", {});
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
    this.browserWindow.controller.type(this.urlbar, aText);
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
    assert.ok(spec.type, "Type of the notification panel is mandatory");

    var panel = null;

    switch (spec.type) {
      case "notification":
        panel = this.getElement({type: "notification_popup"});
        break;
      case "identity":
        panel = this._identityPopup.getElement({type: "popup"});
        break;
      default :
        assert.fail("Unknown notification panel to wait for: " + spec.type);
    }

    waitForNotificationPanel(aCallback, {open: spec.open, panel: panel});
  },

  /**
   * Wait for the current URL to have the expected pageproxystate state
   * 'pageproxystate' is set when the URL location changes
   *
   * @param {string} [aState='valid']
   *        Expected state of page proxy, can be either 'valid' or 'invalid'
   */
  waitForProxyState : function locationBar_waitForProxyState(aState="valid") {
    var urlbar = this.getElement({type: "urlbar"});

    assert.waitFor(() => urlbar.getNode().getAttribute("pageproxystate") === aState,
                   "Current URL has the proxy state: " + aState);
  }
}

/**
 * Menu Panel class
 *
 * @constructor
 * @param {object} aBrowserWindow
 *        Browser window the menu panel is part of
 */
function MenuPanel(aBrowserWindow) {
  assert.ok(aBrowserWindow, "Browser window has been defined");

  this._browserWindow = aBrowserWindow;
  this._panel = this.getElement({type: "panel"});
}

MenuPanel.prototype = {
  /**
   * Get the Browser Window
   *
   * @returns {object} The browser window where the panel lives
   */
  get browserWindow() {
    return this._browserWindow;
  },

  /**
   * Check if the Menu Panel is open
   *
   * @returns {boolen} True if the panel is open, false otherwise
   */
  get isOpen() {
    return this.panel.getNode().state === "open";
  },

  /**
   * Get the panel
   *
   * @returns {MozMillElement} The menu panel
   */
  get panel() {
    return this._panel;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @parma {string} aSpec.type
   *        Identifier of the element
   * @param {string} [aSpec.parent=document]
   *        Parent of the to find element
   *
   * @returns {ElemBase} Element which has been found
   */
  getElement : function MenuPanel_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

   /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   * @param {string} aSpec.type
   *        Identifier of the element
   * @param {string} [aSpec.parent=document]
   *        Parent of the to find element
   *
   * @returns {ElemBase[]} Elements which have been found
   */
  getElements : function MenuPanel_getElements(aSpec) {
    var spec = aSpec || { };

    var root = spec.parent ? spec.parent.getNode()
                           : this.browserWindow.controller.window.document;
    var elems = [];

    switch (spec.type) {
      case "openButton":
        elems = [findElement.ID(root, "PanelUI-menu-button")];
        break;
      case "panel":
        elems = [findElement.ID(root, "PanelUI-popup")];
        break;
      case "panel_addons":
        elems = [findElement.ID(root, "add-ons-button")];
        break;
      case "panel_fxaStatus":
        elems = [findElement.ID(root, "PanelUI-fxa-status")];
        break;
      case "panel_newWindow":
        elems = [findElement.ID(root, "new-window-button")];
        break;
      case "panel_preferences":
        elems = [findElement.ID(root, "preferences-button")];
        break;
      case "panel_quitFirefox":
        elems = [findElement.ID(root, "PanelUI-quit")];
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return elems;
  },

  /**
   * Close the panel
   *
   * @params {object} [aSpec={}]
   *         Information on how to close the panel
   * @params {string} [aSpec.method="shortcut"]
   *         Method to use to close the menu panel ("callback"|"shortcut")
   * @params {function} [aSpec.callback]
   *         Callback that triggers the menu panel to close
   * @params {boolean} [aSpec.force=false]
   *         Force closing the Menu Panel
   *
   */
  close : function MenuPanel_close(aSpec={}) {
    var method = aSpec.method || "shortcut";
    var panel = this.panel;

    if (this.panel.getNode().state === "closed" && aSpec.force) {
      return;
    }

    waitForNotificationPanel(() => {
      if (aSpec.force && panel.getNode()) {
        panel.getNode().hidePopup();
        return;
      }

      switch (method) {
        case "callback":
          assert.equal(aSpec.callback, "function",
                       "Callback has been defined");
          aSpec.callback();
          break;
        case "shortcut":
          panel.keypress("VK_ESCAPE", {});
          break;
        default:
          assert.fail("Unknown method to open the menu panel - " + method);
      }
    }, {panel: panel, open: false});
  },

  /**
   * Open the panel
   *
   * @params {object} [aSpec={}]
   *         Information on how to open the panel
   * @params {string} [aSpec.method="button"]
   *         Method to use to open the menu panel ("button"|"callback")
   * @params {function} [aSpec.callback]
   *         Callback that triggers the menu panel to open
   */
  open : function MenuPanel_open(aSpec={}) {
    var method = aSpec.method || "button";
    var panel = this.panel;

    waitForNotificationPanel(() => {
      switch (method) {
        case "button":
          this.getElement({type: "openButton"}).click();
          break;
        case "callback":
          assert.equal(aSpec.callback, "function",
                       "Callback has been defined");
          aSpec.callback();
          break;
        default:
          assert.fail("Unknown method to open the menu panel - " + method);
      }
    }, {panel: this.panel, open: true});
  }
}

/**
 * Navigation Bar class
 *
 * @constructor
 * @param {object} aBrowserWindow
 *        Browser window the navigation bar is part of
 */
function NavBar(aBrowserWindow) {
  assert.ok(aBrowserWindow, "Browser window has been defined");

  this._browserWindow = aBrowserWindow;
  this._root = this.getElement({type: "nav-bar"});

  this._downloadsPanel = null;
  this._editBookmarksPanel = null;
  this._locationBar = null;
  this._menuPanel = null;
  this._searchBar = null;
}

NavBar.prototype = {
  /**
   * Get the Browser Window
   *
   * @returns {object} The browser window where the nav bar lives
   */
  get browserWindow() {
    return this._browserWindow;
  },

  /**
   * Returns the downloadsPanel object
   *
   * @returns {object} menuPanel
   */
  get downloadsPanel() {
    if (!this._downloadsPanel) {
      this._downloadsPanel = new DownloadsPanel(this.browserWindow);
    }
    return this._downloadsPanel;
  },

  /**
   * Returns the editBookmarksPanel object
   *
   * @returns {object} editBookmarksPanel
   */
  get editBookmarksPanel() {
    if (!this._editBookmarksPanel) {
      this._editBookmarksPanel = new editBookmarksPanel(this.browserWindow);
    }
    return this._editBookmarksPanel;
  },

  /**
   * Returns the locationBar object
   *
   * @returns {object} locationBar
   */
  get locationBar() {
    if (!this._locationBar) {
      this._locationBar = new locationBar(this.browserWindow);
    }
    return this._locationBar;
  },

  /**
   * Returns the menuPanel object
   *
   * @returns {object} menuPanel
   */
  get menuPanel() {
    if (!this._menuPanel) {
      this._menuPanel = new MenuPanel(this.browserWindow);
    }
    return this._menuPanel;
  },

  /**
   * Returns the searchBar object
   *
   * @returns {object} searchBar
   */
  get searchBar() {
    if (!this._searchBar) {
      this._searchBar = new search.searchBar(this.browserWindow.controller);
    }
    return this._searchBar;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @param {string} aSpec.type - General type information
   * @param {string} [aSpec.subtype] - Attribute of the element to filter
   * @param {string} [aSpec.value] - Value of the element or property
   * @param {element} [aSpec.parent=document] - Parent of the to find element
   *
   * @returns {ElemBase} Element which has been found
   */
  getElement : function NavBar_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @param {string} aSpec.type - General type information
   * @param {string} [aSpec.subtype] - Attribute of the element to filter
   * @param {string} [aSpec.value] - Value of the element or property
   * @param {element} [aSpec.parent=document] - Parent of the to find element
   *
   * @returns {ElemBase[]} Elements which have been found
   */
  getElements : function NavBar_getElements(aSpec) {
    var spec = aSpec || {};

    var root = spec.parent ? spec.parent.getNode()
                           : this.browserWindow.controller.window.document;
    var nodeCollector = new domUtils.nodeCollector(root);

    switch(spec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
      case "bookmarksMenuButton":
        return [findElement.ID(root, "bookmarks-menu-button")];
      case "feedButton":
        return [findElement.ID(root, "feed-button")];
      case "nav-bar":
        return [findElement.ID(root, "nav-bar")];
      case "PersonalToolbar":
        return [findElement.ID(root, "PersonalToolbar")];
      case "starButton":
        nodeCollector.root = this.getElement({type: "bookmarksMenuButton"}).
                                  getNode();
        nodeCollector.queryAnonymousNode("anonid", "button");
        break;
      case "toggle_PersonalToolbar":
        return [findElement.ID(root, "toggle_PersonalToolbar")];
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return nodeCollector.elements;
  },

  /**
   * Bookmark a page
   * Also waits for the animation event that occurs to finish
   *
   * @param {function} aCallback
   *        Function to trigger page bookmarking event
   */
  bookmarkWithAnimation : function NavBar_bookmarkWithAnimation(aCallback) {
    var self = { started: false, ended: false };
    var bookmarksMenuButton = this.getElement({type: "bookmarksMenuButton"});
    var window = this.browserWindow.controller.window.document.defaultView;

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
   * Toggle bookmarks toolbar
   *
   * @param {Boolean} aState
   *        Expected state of the BookmarksToolbar
   */
  toggleBookmarksToolbar : function NavBar_toggleBookmarksToolbar(aState) {
    var navbar = this._root;

    navbar.rightClick(navbar.getNode().boxObject.width / 2, 2);

    var toggle = this.getElement({type: 'toggle_PersonalToolbar'});
    toggle.mouseDown();
    toggle.mouseUp();

    // Check that the Bookmark toolbar is in the correct state
    var state = !!aState;
    var bookmarksToolbar = this.getElement({type: "PersonalToolbar"});
    assert.waitFor(function () {
      return bookmarksToolbar.getNode().getAttribute("collapsed") === String(!state);
    }, "Bookmarks Toolbar has " + ((state) ? "opened" : "closed"));
  }
}

/**
 * Waits for a notification popup panel
 *
 * @param {function} aCallback
 *        Function that triggers the panel to open/close
 * @param {object} aSpec
 *        Information related to the notification to wait for
 * @param {object} aSpec.panel
 *        The panel to wait for
 * @param {object} [aSpec.parent=aSpec.panel._defaultView]
 *        Element to use for waiting for the events (usually the panel)
 * @param {boolean} [aSpec.open=true]
 *        True if the notification should be open
 */
function waitForNotificationPanel(aCallback, aSpec) {
  var spec = aSpec || {};

  assert.equal(typeof aCallback, "function", "Callback function is defined");
  assert.ok(spec.panel, "Panel has to be specified");

  var open = (typeof spec.open === "undefined") || spec.open;

  var eventType = "popupshown";
  if (open) {
    if (spec.panel.getNode()) {
      assert.waitFor(() => (spec.panel.getNode().state === "closed"),
                     "Panel is in closed state");
    }
    else {
      spec.parent = spec.parent || spec.panel._defaultView;
    }
  }
  else {
    assert.waitFor(() => (spec.panel.getNode().state === "open"),
                   "Panel is in opened state");
    eventType = "popuphidden";
  }

  var parent = spec.parent || spec.panel.getNode();
  var panelStateChanged = false;

  function onPanelState() { panelStateChanged = true; }
  parent.addEventListener(eventType, onPanelState);

  try {
    aCallback(spec.panel);

    assert.waitFor(() => {
      return panelStateChanged;
    }, "Notification popup state has been " + (open ? "opened" : "closed"));
  }
  finally {
    parent.removeEventListener(eventType, onPanelState);
  }
}

// Export of classes
exports.NavBar = NavBar;

// Export of functions
exports.waitForNotificationPanel = waitForNotificationPanel;
