/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The TabbedBrowsingAPI adds support for accessing and interacting with tab elements
 *
 * @version 1.0.0
 */

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var { assert } = require("../../lib/assertions");
var domUtils = require("../../lib/dom-utils");
var prefs = require("../../lib/prefs");
var sessionStore = require("../lib/sessionstore");
var utils = require("../../lib/utils");

const PREF_NEWTAB_INTRO = "browser.newtabpage.introShown";
const PREF_NEWTAB_PRELOAD = "browser.newtab.preload";
const PREF_TABS_ANIMATE = "browser.tabs.animate";

const TABS_VIEW = '/id("main-window")/id("tab-view-deck")/[0]';
const TABS_BROWSER = TABS_VIEW + utils.australis.getElement("tabs") +
                     '/id("browser")/id("appcontent")/id("content")';
const TABS_TOOLBAR = TABS_VIEW + '/id("navigator-toolbox")/id("TabsToolbar")';
const TABS_TABS = TABS_TOOLBAR + '/id("tabbrowser-tabs")';
const TABS_ARROW_SCROLLBOX = TABS_TABS + '/anon({"anonid":"arrowscrollbox"})';
const TABS_STRIP = TABS_ARROW_SCROLLBOX + '/anon({"anonid":"scrollbox"})/anon({"flex":"1"})';

/**
 * Close all tabs and open about:blank
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function closeAllTabs(aController)
{
  var browser = new tabBrowser(aController);
  browser.closeAllTabs();
}

/**
 * Check and return all open tabs with the specified URL
 *
 * @param {string} aUrl
 *        URL to check for
 * @param {boolean} [aIgnoreFragment]
 *        Exclude fragment-portion of the uri when comparing
 *
 * @returns Array of tabs
 */
function getTabsWithURL(aUrl, aIgnoreFragment) {
  var tabs = [ ];

  var uri = utils.createURI(aUrl, null, null);

  // Iterate through all windows
  var windows = Services.wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    var window = windows.getNext();

    // Don't check windows which are about to close or don't have gBrowser set
    if (window.closed || !("gBrowser" in window))
      continue;

    // Iterate through all tabs in the current window
    var browsers = window.gBrowser.browsers;
    for (var i = 0; i < browsers.length; i++) {
      var browser = browsers[i];
      var checkMethod = (aIgnoreFragment) ? "equalsExceptRef" : "equals";
      if (browser.currentURI[checkMethod](uri)) {
        tabs.push({
          controller : new mozmill.controller.MozMillController(window),
          index : i
        });
      }
    }
  }

  return tabs;
}

/**
 * Constructor
 *
 * @param {Object} aTabBrowser
 *        TabBrowser object
 */
function findBar(aTabBrowser) {
  this._tabBrowser = aTabBrowser;
  this._controller = aTabBrowser.controller;
  this._findbar = null;
}

/**
 * FindBar class
 */
findBar.prototype = {
   /**
   * Returns the controller of the current window
   *
   * @returns {MozMillController}
   */
  get controller() {
    return this._controller;
  },

   /**
   * Returns the referenced TabBrowser instance
   *
   * @returns {object} TabBrowser
   */
  get tabBrowser() {
    return this._tabBrowser;
  },

  /**
   * Get Case-sensitive state
   *
   * @return {boolean}
   *         Return the state of the case-sensitive button
   */
  get caseSensitive() {
    assert.ok(this.isOpen, "The FindBar needs to be open.")

    var elem = this.getElement({type: "caseSensitiveButton"});
    return elem.getNode().checked;
  },

  /**
   * Set Case-sensitive state
   *
   * @param {boolean} [aEnabledState]
   *        If true, search text with case sensitive
   */
  set caseSensitive(aEnabledState) {
    assert.ok(this.isOpen, "The FindBar needs to be open.")

    var elem = this.getElement({type: "caseSensitiveButton"});
    elem.check(aEnabledState);
  },

 /**
  * Gets all the needed external DTD URLs as an array
  *
  * @returns [{string}]
  *          Array of external DTD URLs
  */
  get dtds() {
    return ["chrome://browser/locale/browser.dtd"];
  },

  /**
   * Get Highlight state
   *
   * @return {boolean}
   *         Return the state of the highlight button
   */
  get highlight() {
    assert.ok(this.isOpen, "The FindBar needs to be open.");

    var elem = this.getElement({type: "highlightButton"});
    return elem.getNode().checked;
  },

  /**
   * Set Highlight state
   *
   * @param {boolean} [aEnabledState]
   *        If true highlight the result
   */
  set highlight(aEnabledState) {
    assert.ok(this.isOpen, "The FindBar needs to be open.");

    var elem = this.getElement({type: "highlightButton"});
    elem.check(aEnabledState);
  },

  /**
   * Check if the FindBar is open
   *
   * @returns {boolean}
   *          True if the findBar is open
   */
  get isOpen() {
    return this._findbar && !this._findbar.hidden;
  },

  /**
   * Get the text from the findBar textbox
   *
   * @returns {string}
   *          Text from the textbox element
   */
  get value() {
    assert.ok(this._findbar, "The Findbar object exists");
    return this.getElement({type: "textbox"}).getNode().value;
  },

  /**
   * Sets the value in the findBar textbox
   *
   * @param {string} aValue
   *        Text value to be set in the findBar textbox
   */
  set value(aValue) {
    assert.ok(this._findbar, "The Findbar object exists");
    var textbox = this.getElement({type: "textbox"}).getNode();
    textbox.value = aValue;
  },

  /**
   * Clear FindBar of any input
   */
  clear : function findBar_clear() {
    assert.ok(this.isOpen, "The FindBar needs to be open.");

    var elem = this.getElement({type: "textbox"});
    elem.doubleClick();
    elem.keypress("VK_DELETE");

    assert.waitFor(() => {
      return this.value === "";
    }, "The findBar has been cleared.");
  },

  /**
   * Close FindBar
   *
   * @param {boolean} [aForce=false]
   *        If true close the findBar via an API call.
   */
  close : function findBar_close(aForce) {
    assert.ok(this._findbar, "Findbar instance exists");
    if (aForce) {
      this._findbar.close();
    }
    else {
      var elem = this.getElement({type: "closeButton"});
      elem.click();
    }

    assert.waitFor(() => !this.isOpen, "The FindBar has been closed.");
  },

  /**
   * Next result
   */
  findNext : function findBar_findNext() {
    assert.ok(this.isOpen, "The FindBar needs to be open.");

    var elem = this.getElement({type: "nextButton"});
    elem.click();
  },

  /**
   * Previous result
   */
  findPrevious : function findBar_findPrevious() {
    assert.ok(this.isOpen, "The FindBar needs to be open.");

    var elem = this.getElement({type: "previousButton"});
    elem.click();
  },

  /**
   * Retrieve an UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @param {string} [aSpec.type]
   *        Which element type to return
   * @param {string} [aSpec.parent=this._findbar]
   *        Parent of the element or property
   * @returns {ElemBase}
   *          Elements which has been found
   */
  getElement : function findBar_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @param {string} [aSpec.type]
   *        Which element type to return
   * @param {string} [aSpec.parent=this._findbar]
   *        Parent of the element or property
   * @returns [{ElemBase}]
   *          Array of Elements which has been found
   */
  getElements : function findBar_getElements(aSpec) {
    var spec = aSpec || { };

    var root = spec.parent ? spec.parent.getNode() : this._findbar;
    var nodeCollector = new domUtils.nodeCollector(root);

    switch(spec.type) {
      case "findBar":
        nodeCollector.queryNodes("findbar");
        break;
      case "caseSensitiveButton":
        nodeCollector.queryAnonymousNode("anonid", "find-case-sensitive");
        break;
      case "closeButton":
        nodeCollector.queryAnonymousNode("anonid", "find-closebutton");
        break;
      case "highlightButton":
        nodeCollector.queryAnonymousNode("anonid", "highlight");
        break;
      case "nextButton":
        nodeCollector.queryAnonymousNode("anonid", "find-next");
        break;
      case "previousButton":
        nodeCollector.queryAnonymousNode("anonid", "find-previous");
        break;
      case "textbox":
        nodeCollector.queryAnonymousNode("anonid", "findbar-textbox");
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return nodeCollector.elements;
  },

  /**
   * Open the FindBar
   *
   * @param {string} [aEventType="shortcut"]
   *        Available opening methods: "menu", "shortcut"
   */
  open : function findBar_open(aEventType) {
    var type = aEventType || "shortcut";

    var isOpen = false;
    function hasOpened() {
      isOpen = true;
    }

    this.controller.window.addEventListener("findbaropen", hasOpened);

    try {
      switch (type) {
        case "shortcut":
          var cmdKey = utils.getEntity(this.dtds, "findOnCmd.commandkey");
          this.controller.keypress(null, cmdKey, {accelKey: true});
          break;
        case "menu":
          this.controller.mainMenu.click("#menu_find");
          break;
        default:
          assert.fail("Unknown event type - " + type);
      }
      assert.waitFor(() => isOpen, "FindBar has been opened.");
    }
    finally {
      this.controller.window.removeEventListener("findbaropen", hasOpened);
    }

    // Cache the root node of the findBar
    this._findbar = this.getElement({type: "findBar",
                                     parent: this.tabBrowser.activeTabPanel}).getNode();
  },

  /**
   * Set search text
   *
   * @param {string} aText
   *        Text used as search keywords.
   */
  search : function findBar_search(aText) {
    assert.ok(this.isOpen, "The FindBar needs to be open.");

    var elem = this.getElement({type: "textbox"});
    this.clear();
    elem.sendKeys(aText);
    assert.equal(aText, this.value,
                 "Successfully typed the text into the findbar");

    elem.keypress("VK_RETURN", {});
  }
};

/**
 * Constructor
 *
 * @param {MozMillController} aController
 *        MozMill controller of the window to operate on
 */
function tabBrowser(aController) {
  this._controller = aController;
  this.findBar = new findBar(this);
  this._tabs = this.getElement({type: "tabs"});

  // Bug 1076870
  // TODO: Remove this pref once it has been added in Mozmill
  prefs.setPref(PREF_NEWTAB_INTRO, true);
}

/**
 * Tabbed Browser class
 */
tabBrowser.prototype = {
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
   * This returns the activeTabPanel
   *
   * @returns {ElemBase}
   *          The active tab panel
   */
  get activeTabPanel() {
    return this.getElement({type: "tabs_tabPanel",
                            value: this.getTab()});
  },

  /**
   * Get the amount of open tabs
   *
   * @returns Number of tabs
   * @type {number}
   */
  get length() {
    return this._tabs.getNode().itemCount;
  },

  /**
   * Get the currently selected tab index
   *
   * @returns Index of currently selected tab
   * @type {number}
   */
  get selectedIndex() {
    return this._tabs.getNode().selectedIndex;
  },

  /**
   * Select the tab with the given index
   *
   * @param {number} aIndex
   *        Index of the tab which should be selected
   */
  set selectedIndex(aIndex) {
    this.selectTab({index: aIndex});
  },

  /**
   * Get the current state of the tabs on top setting
   *
   * @returns {Boolean} Current state
   */
  get hasTabsOnTop() {
    return this._controller.window.TabsOnTop.enabled;
  },

  /**
   * Set the current state of the tabs on top setting
   *
   * @param {Boolean} True, if tabs should be on top
   */
  set hasTabsOnTop(aValue) {
    this._controller.window.TabsOnTop.enabled = aValue;
  },

  /**
   * Get the security UI
   *
   * @returns {object} Reference to the security UI
   */
  get securityUI() {
    return this._controller.window.getBrowser().mCurrentBrowser.securityUI;
  },

  /**
   * Close all tabs of the window except the last one and open a blank page.
   */
  closeAllTabs : function tabBrowser_closeAllTabs() {
    // TODO: Bug 1120906
    // waitForPageLoad fails after opening "about:newtab" when
    // "browser.newtab.preload" preference is set to true
    prefs.setPref(PREF_NEWTAB_PRELOAD, false);

    try {
      this.openTab();
      this.controller.waitForPageLoad();
    }
    finally {
      prefs.clearUserPref(PREF_NEWTAB_PRELOAD);
    }

    this.selectTab({index: 0});

    while (this.controller.tabs.length > 1) {
      this.closeTab();
    }
  },

  /**
   * Close a tab using different methods
   *
   * @param {object} [aSpec]
   *        Information about how to close the tab
   * @param {function} [aSpec.callback]
   *        Callback used for closing the tab
   * @param {number} [aSpec.index=selectedIndex]
   *        Index of the tab to close (only used for middleClick)
   * @param {string} [aSpec.method="menu"]
   *        Method used for closing the tab
   *        ("button", "callback", "menu", "shortcut", "middleClick")
   * @param {MozElement} [aSpec.target]
   *        Element from where to open the tab
   */
  closeTab : function tabBrowser_closeTab(aSpec={}) {
    var method = aSpec.method || "menu";
    var index = (typeof aSpec.index === undefined) ? this.selectedIndex
                                                   : aSpec.index;

    // Bug 1112601
    // TODO: Remove this pref once it has been added in Mozmill
    prefs.setPref(PREF_TABS_ANIMATE, false);

    // Add event listener to wait until the tab has been closed
    var closed = false;
    var checkTabClosed = () => { closed = true; }
    this.controller.window.addEventListener("TabClose", checkTabClosed, false);

    var callback = () => {
      switch (method) {
        case "button":
          var button = this.getElement({type: "tabs_tabCloseButton",
                                       subtype: "tab", value: this.getTab()});

          // Wait for the button to be displayed
          assert.waitFor(() => utils.isDisplayed(this.controller, button),
                         "Close button is visible");
          button.click();
          break;
        case "callback":
          assert.equal(typeof aSpec.callback, "function",
                       "Callback is defined");

          aSpec.callback();
          break;
        case "menu":
          this.controller.mainMenu.click("#menu_close");
          break;
        case "shortcut":
          var cmdKey = utils.getEntity(this.getDtds(), "closeCmd.key");
          this.controller.keypress(null, cmdKey, {accelKey: true});
          break;
        case "middleClick":
          var tab = this.getTab(index);
          tab.middleClick();
          break;
        default:
          assert.fail("Unknown method - " + method);
      }
    };

    try {
      callback();

      assert.waitFor(() => closed, "Tab has been closed");
    }
    finally {
      this.controller.window.removeEventListener("TabClose", checkTabClosed);
      prefs.clearUserPref(PREF_TABS_ANIMATE);
    }
  },

  /**
   * Gets all the needed external DTD URLs as an array
   *
   * @returns Array of external DTD URLs
   * @type [string]
   */
  getDtds : function tabBrowser_getDtds() {
    var dtds = ["chrome://browser/locale/browser.dtd",
                "chrome://browser/locale/newTab.dtd",
                "chrome://browser/locale/tabbrowser.dtd",
                "chrome://global/locale/global.dtd"];
    return dtds;
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
   * @type {ElemBase}
   */
  getElement : function tabBrowser_getElement(aSpec) {
    var document = this._controller.window.document;
    var elem = null;

    switch (aSpec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
      case "openLinkInNewTab":
        elem = new elementslib.ID(this._controller.window.document,
                                  "context-openlinkintab");
        break;
      case "tabs":
        elem = new elementslib.Lookup(this._controller.window.document,
                                      TABS_TABS);
        break;
      case "tabs_allTabsButton":
        elem = new elementslib.Lookup(this._controller.window.document,
                                      TABS_TOOLBAR + '/id("alltabs-button")');
        break;
      case "tabs_allTabsPopup":
        elem = new elementslib.Lookup(this._controller.window.document, TABS_TOOLBAR +
                                      '/id("alltabs-button")/id("alltabs-popup")');
        break;
      case "tabs_newTabButton":
        elem = new elementslib.Lookup(this._controller.window.document,
                                      TABS_ARROW_SCROLLBOX + '/anon({"class":"tabs-newtab-button"})');
        break;
      case "tabs_scrollButton":
        elem = new elementslib.Lookup(this._controller.window.document,
                                      TABS_ARROW_SCROLLBOX +
                                      '/anon({"anonid":"scrollbutton-' + aSpec.subtype + '"})');
        break;
      case "tabs_strip":
        elem = new elementslib.Lookup(this._controller.window.document, TABS_STRIP);
        break;
      case "tabs_tab":
        switch (aSpec.subtype) {
          case "index":
            elem = new elementslib.Elem(this._tabs.getNode().getItemAtIndex(aSpec.value));
            break;
        }
        break;
      case "tabs_tabCloseButton":
        var node = document.getAnonymousElementByAttribute(
                     aSpec.value.getNode(),
                     "anonid",
                     "close-button"
                   );
        elem = new elementslib.Elem(node);
        break;
      case "tabs_tabFavicon":
        var node = document.getAnonymousElementByAttribute(
                     aSpec.value.getNode(),
                     "class",
                     "tab-icon-image"
                   );

        elem = new elementslib.Elem(node);
        break;
      case "tabs_tabPanel":
        var panelId = aSpec.value.getNode().getAttribute("linkedpanel");
        elem = new elementslib.Lookup(this._controller.window.document, TABS_BROWSER +
                                      '/anon({"anonid":"tabbox"})/anon({"anonid":"panelcontainer"})' +
                                      '/{"id":"' + panelId + '"}');
        break;
      default:
        assert.fail("Unknown element type - " + aSpec.type);
    }

    return elem;
  },

  /**
   * Get the tab at the specified index
   *
   * @param {number} aIndex
   *        Index of the tab
   * @returns The requested tab
   * @type {ElemBase}
   */
  getTab : function tabBrowser_getTab(aIndex) {
    if (aIndex === undefined)
      aIndex = this.selectedIndex;

    return this.getElement({type: "tabs_tab", subtype: "index", value: aIndex});
  },

  /**
   * Check if the specified tab is an AppTab
   *
   * @param {ElemBase} aTab
   *        Index of the tab
   * @returns {Boolean} True if the tab is an AppTab
   */
  isAppTab : function tabBrowser_isAppTab(aTab) {
    return aTab.getNode().hasAttribute('pinned');
  },

  /**
   * Creates the child element of the tab's notification bar
   *
   * @param {number} aTabIndex
   *        (Optional) Index of the tab to check
   * @param {string} aElemString
   *        (Optional) Lookup string of the notification bar's child element
   * @return The created child element
   * @type {ElemBase}
   */
  getTabPanelElement : function tabBrowser_getTabPanelElement(aTabIndex, aElemString) {
    var index = aTabIndex ? aTabIndex : this.selectedIndex;
    var elemStr = aElemString ? aElemString : "";

    // Get the tab panel and check if an element has to be fetched
    var panel = this.getElement({type: "tabs_tabPanel", subtype: "tab", value: this.getTab(index)});
    var elem = new elementslib.Lookup(this._controller.window.document, panel.expression + elemStr);

    return elem;
  },

  /**
   * Pin the selected Tab
   *
   * @param {ElemBase} aTab
   */
  pinTab : function tabBrowser_pinTab(aTab) {
    var contextMenu = this._controller.getMenu("#tabContextMenu");
    contextMenu.select("#context_pinTab", aTab);
  },

  /**
   * Unpin the selected Tab
   *
   * @param {ElemBase} aTab
   */
  unpinTab : function tabBrowser_unpinTab(aTab) {
    var contextMenu = this._controller.getMenu("#tabContextMenu");
    contextMenu.select("#context_unpinTab", aTab);
  },

  /**
   * Open a new tab using different methods
   *
   * @param {object} [aSpec]
   *        Information about how to open the tab
   * @param {function} [aSpec.callback]
   *        Callback used for opening the tab
   * @param {string} [aSpec.method="menu"]
   *        Method used for opening the tab
   *        ("callback", "menu", "newTabButton", "shortcut", "tabStrip"
   *         "contextMenu", "middleClick")
   * @param {MozElement} [aSpec.target]
   *        Element from where to open the tab
   */
  openTab : function tabBrowser_openTab(aSpec) {
    var spec = aSpec || {};
    var method = spec.method || "menu";

    this._waitForTabOpened(() => {
      switch (method) {
        case "callback":
          assert.equal(typeof spec.callback, "function",
                       "Callback function is defined");

          spec.callback();
          break;
        case "menu":
          this._controller.mainMenu.click("#menu_newNavigatorTab");
          break;
        case "newTabButton":
          var newTabButton = this.getElement({type: "tabs_newTabButton"});
          newTabButton.click();
          break;
        case "shortcut":
          var cmdKey = utils.getEntity(this.getDtds(), "tabCmd.commandkey");
          this._controller.keypress(null, cmdKey, {accelKey: true});
          break;
        case "tabStrip":
          var tabStrip = this.getElement({type: "tabs_strip"});

          // RTL-locales need to be treated separately
          if (utils.getEntity(this.getDtds(), "locale.dir") == "rtl") {
            // TODO: Calculate the correct x position
            this._controller.doubleClick(tabStrip, 100, 3);
          }
          else {
            // TODO: Calculate the correct x position
            this._controller.doubleClick(tabStrip, tabStrip.getNode().clientWidth - 100, 3);
          }
          break;
        case "contextMenu":
          assert.ok(spec.target, "Target element has to be specified");

          var contextMenu = this._controller.getMenu("#contentAreaContextMenu");
          contextMenu.select("#context-openlinkintab", aSpec.target);
          break;
        case "middleClick":
          assert.ok(spec.target, "Target element has to be specified");

          spec.target.middleClick();
          break;
        default:
          assert.fail("Unknown method - " + method);
      }
    });
  },

  /**
   * Method for reopening the last closed tab
   *
   * @param {object} [aSpec]
   *        Information about how to open the tab
   * @param {string} [aSpec.method="shortcut"]
   *        Method used for opening the tab
   */
  reopen: function tabBrowser_reopen(aSpec) {
    var spec = aSpec || {};
    var method = spec.method || "shortcut";

    var tabCount = sessionStore.getClosedTabCount(this._controller);
    assert.notEqual(tabCount, 0,
                    "'Recently Closed Tabs' sub menu has at least one entry");

    this._waitForTabOpened(() => {
      switch (method) {
        case "contextMenu":
          var contextMenu = this._controller.getMenu("#tabContextMenu");
          contextMenu.select("#context_undoCloseTab", this.getTab());
          break;
        case "mainMenu":
          this._controller.mainMenu.click("#historyUndoMenu .restoreallitem");
          break;
        case "shortcut":
          var cmdKey = utils.getEntity(this.getDtds(), "tabCmd.commandkey");
          this._controller.keypress(null, cmdKey,
                                    {accelKey: true, shiftKey: true});
          break;
        default:
          assert.fail("Unknown method - " + method);
      }
    });

    assert.equal(sessionStore.getClosedTabCount(this._controller), tabCount - 1,
                 "'Recently Closed Tabs' sub menu entries have changed");
  },

  /**
   * Select a tab using different methods
   *
   * @param {object} [aSpec]
   *        Information about how to open the tab
   * @param {function} [aSpec.callback]
   *        Callback used for opening the tab
   * @param {number} [aSpec.index]
   *        Index of the tab to select
   * @param {string} [aSpec.method="click"]
   *        Method used for opening the tab ("click"|"callback")
   * @param {MozElement} [aSpec.tab]
   *        Tab to select
   */
  selectTab: function tabBrowser_selectTab(aSpec={}) {
    var method = aSpec.method || "click";
    var tabSelected = false;

    assert.ok(aSpec.tab || (typeof aSpec.index === "number") || aSpec.callback,
              "Either index, tab or callback should be specified");

    if (!aSpec.callback) {
      var tab = (typeof aSpec.index === "number") ? this.getTab(aSpec.index)
                                                  : aSpec.tab;

      // Requested tab is already selected
      if (tab.getNode().selected) {
        return;
      }
    }

    function checkTabSelected() { tabSelected = true; }
    this.controller.window.addEventListener("TabSelect", checkTabSelected);

    try {
      switch (method) {
        case "click":
          /** When the tab opens, the close button animates.
           * If it animates under the real mouse, it will set
           * the mOverCloseButton flag to true.
           * Even with a click in the middle of the tab, the flag doesn't get set
           * to false without a mousemove event and so the tab isn't selected.
           */
          tab.mouseEvent(undefined, undefined, {type: "mousemove"});
          tab.click();
          break;
        case "callback":
          assert.equal(typeof aSpec.callback, "function",
                       "Callback has been defined!");
          aSpec.callback();
          break;
        default:
          assert.fail("Unknown method - " + aSpec.method);
      }
      assert.waitFor(() => tabSelected,
                     "Tab has been selected");
    }
    finally {
      this.controller.window.removeEventListener("TabSelect", checkTabSelected);
    }
  },

  /**
   * Wait for a tab to open
   *
   * @param {function} aCallback
   *        Function that opens the tab
   */
  _waitForTabOpened: function tabBrowser_waitForTabOpened(aCallback) {
    // Bug 1112601
    // TODO: Remove this pref once it has been added in Mozmill
    prefs.setPref(PREF_TABS_ANIMATE, false);

    // Add event listener to wait until the tab has been opened
    var opened = false;
    var checkTabOpened = () => { opened = true; }
    this.controller.window.addEventListener("TabOpen", checkTabOpened);

    try {
      aCallback();

      assert.waitFor(() => opened, "Tab has been opened");
    }
    finally {
      this.controller.window.removeEventListener("TabOpen", checkTabOpened);
      prefs.clearUserPref(PREF_TABS_ANIMATE);
    }
  },

  /**
   * Waits for a particular tab panel element to display and stop animating
   *
   * @param {number} aTabIndex
   *        Index of the tab to check
   * @param {function} aCallback
   *        Function that triggeres the panel to open
   * @param {string} aElemString
   *        Lookup string of the tab panel element
   */
  waitForTabPanel: function tabBrowser_waitForTabPanel(aTabIndex, aCallback, aElemString) {
    assert.equal(typeof aCallback, "function", "Callback function is defined");

    var transitionEnd = false;
    function onTransitionEnd() { transitionEnd = true; }
    this._controller.window.addEventListener("transitionend", onTransitionEnd);

    try {
      aCallback();

      assert.waitFor(() => transitionEnd,
                     "Notification transition finished");
    }
    finally {
      this._controller.window.removeEventListener("transitionend", onTransitionEnd);
    }

    assert.ok(this.getTabPanelElement(aTabIndex, aElemString).exists(),
              "Notification bar has been opened")
  }
}

// Export of functions
exports.closeAllTabs = closeAllTabs;
exports.getTabsWithURL = getTabsWithURL;

// Export of classes
exports.tabBrowser = tabBrowser;
