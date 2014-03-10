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

/**
 * Initialisation of tabs observer, which will set "isAnimated" flag when
 * scroll-button collapses
 */
var animationObserver = {
  isAnimated: true,

  /**
   * @param {MozElement} aElement
   *        Element to observe
   */
  init: function (aElement) {
    var win = aElement.getNode().ownerDocument.defaultView;
    var self = this;
    this.mutationObserver = new win.MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        self.isAnimated = mutation.target.hasAttribute("collapsed");
      });
    });
    this.mutationObserver.observe(aElement.getNode(), {attributes: true,
                                                       attributeFilter: ["collapsed"]});
  }
}

// Include required modules
var { assert } = require("../../lib/assertions");
var utils = require("utils");
var prefs = require("prefs");


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
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function closeAllTabs(controller)
{
  var browser = new tabBrowser(controller);
  browser.closeAllTabs();
}

/**
 * Check and return all open tabs with the specified URL
 *
 * @param {string} aUrl
 *        URL to check for
 *
 * @returns Array of tabs
 */
function getTabsWithURL(aUrl) {
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
      if (browser.currentURI.equals(uri)) {
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
 * @param {MozMillController} controller
 *        MozMill controller of the window to operate on
 */
function tabBrowser(controller) {
  this._controller = controller;
  this._tabs = this.getElement({type: "tabs"});
  let tabsScrollButton = this.getElement({type: "tabs_scrollButton",
                                          subtype: "down"});
  animationObserver.init(tabsScrollButton);
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
   * @param {number} index
   *        Index of the tab which should be selected
   */
  set selectedIndex(index) {
    var tab = this.getTab(index);
    assert.waitFor(function() {
      return !tab.getNode().hasAttribute("busy");
    }, "The tab has loaded");

    // Issue a mousemove event to allow the tab activation click event to propagate
    // Tab activation is disabled if the mouse is hovering over the close button
    // See: http://hg.mozilla.org/mozilla-central/file/e5b09585215f/browser/base/content/tabbrowser.xml#l4802
    tab.mouseEvent(null, null, {type: "mousemove"});
    this._controller.click(tab);
    assert.waitFor(function () {
      return this.selectedIndex === index;
    }, "The tab with index '" + index + "' has been selected", undefined,
     undefined, this);
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
   * Close all tabs of the window except the last one and open a blank page.
   */
  closeAllTabs : function tabBrowser_closeAllTabs() {
    while (this._controller.tabs.length > 1) {
      this.closeTab();
    }

    this._controller.open(this._controller.window.BROWSER_NEW_TAB_URL);
    this._controller.waitForPageLoad();
  },

  /**
   * Close an open tab
   *
   * @param {String} [aEventType="menu"]
   *   Type of event which triggers the action
   *   <dl>
   *     <dt>closeButton</dt>
   *     <dd>The close button on the selected tab is used</dd>
   *     <dt>menu</dt>
   *     <dd>The main menu is used</dd>
   *     <dt>middleClick</dt>
   *     <dd>A middle mouse click gets synthesized</dd>
   *     <dt>shortcut</dt>
   *     <dd>The keyboard shortcut is used</dd>
   *   </dl>
   * @param {Number} [aIndex=selectedIndex]
   *   Index of the tab to close (only used for middleClick)
   */
  closeTab : function tabBrowser_closeTab(aEventType, aIndex) {
    var type = aEventType || "menu";
    var index = (typeof aIndex === undefined) ? this.selectedIndex : aIndex;

    var length = this.length;

    switch (type) {
      case "closeButton":
        var button = this.getElement({type: "tabs_tabCloseButton",
                                     subtype: "tab", value: this.getTab()});
        this._controller.click(button);
        break;
      case "menu":
        this._controller.mainMenu.click("#menu_close");
        break;
      case "middleClick":
        var tab = this.getTab(index);
        this._controller.middleClick(tab);
        break;
      case "shortcut":
        var cmdKey = utils.getEntity(this.getDtds(), "closeCmd.key");
        this._controller.keypress(null, cmdKey, {accelKey: true});
        break;
      default:
        assert.fail("Unknown event type - " + type);
    }

    // When removing a tab it animates outside of visible space and only after that
    // it's being removed, so the length property gets updated last
    var self = this;
    assert.waitFor(function () {
      return self.length === length - 1;
    }, "Tab has been closed");
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
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
   * @param {object} spec
   *        Information of the UI element which should be retrieved
   *        type: General type information
   *        subtype: Specific element or property
   *        value: Value of the element or property
   * @returns Element which has been created
   * @type {ElemBase}
   */
  getElement : function tabBrowser_getElement(spec) {
    var document = this._controller.window.document;
    var elem = null;

    switch(spec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
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
                                      '/anon({"anonid":"scrollbutton-' + spec.subtype + '"})');
        break;
      case "tabs_strip":
        elem = new elementslib.Lookup(this._controller.window.document, TABS_STRIP);
        break;
      case "tabs_tab":
        switch (spec.subtype) {
          case "index":
            elem = new elementslib.Elem(this._tabs.getNode().getItemAtIndex(spec.value));
            break;
        }
        break;
      case "tabs_tabCloseButton":
        var node = document.getAnonymousElementByAttribute(
                     spec.value.getNode(),
                     "anonid",
                     "close-button"
                   );
        elem = new elementslib.Elem(node);
        break;
      case "tabs_tabFavicon":
        var node = document.getAnonymousElementByAttribute(
                     spec.value.getNode(),
                     "class",
                     "tab-icon-image"
                   );

        elem = new elementslib.Elem(node);
        break;
      case "tabs_tabPanel":
        var panelId = spec.value.getNode().getAttribute("linkedpanel");
        elem = new elementslib.Lookup(this._controller.window.document, TABS_BROWSER +
                                      '/anon({"anonid":"tabbox"})/anon({"anonid":"panelcontainer"})' +
                                      '/{"id":"' + panelId + '"}');
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return elem;
  },

  /**
   * Get the tab at the specified index
   *
   * @param {number} index
   *        Index of the tab
   * @returns The requested tab
   * @type {ElemBase}
   */
  getTab : function tabBrowser_getTab(index) {
    if (index === undefined)
      index = this.selectedIndex;

    return this.getElement({type: "tabs_tab", subtype: "index", value: index});
  },

  /**
   * Check if the specified tab is an AppTab
   *
   * @param {ElemBase} tab
   *        Index of the tab
   * @returns {Boolean} True if the tab is an AppTab
   */
  isAppTab : function tabBrowser_isAppTab(tab) {
    return tab.getNode().hasAttribute('pinned');
  },

  /**
   * Creates the child element of the tab's notification bar
   *
   * @param {number} tabIndex
   *        (Optional) Index of the tab to check
   * @param {string} elemString
   *        (Optional) Lookup string of the notification bar's child element
   * @return The created child element
   * @type {ElemBase}
   */
  getTabPanelElement : function tabBrowser_getTabPanelElement(tabIndex, elemString) {
    var index = tabIndex ? tabIndex : this.selectedIndex;
    var elemStr = elemString ? elemString : "";

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
   * Open element (link) in a new tab
   *
   * @param {Elem} aTarget - Element to interact with
   * @param {String} [aEventType="middleClick"] Type of event which triggers the action
   *   <dl>
   *     <dt>contextMenu</dt>
   *     <dd>The "Open in new Tab" context menu entry is used</dd>
   *     <dt>middleClick</dt>
   *     <dd>A middle mouse click gets synthesized</dd>
   *   </dl>
   */
  openInNewTab : function tabBrowser_openInNewTab(aTarget, aEventType) {
    var type = aEventType || "middleClick";
    var self = {
      opened: false,
      transitioned: false
    };

    function checkTabOpened() { self.opened = true; }
    function checkTabTransitioned() { self.transitioned = true; }

    // Add event listener to wait until the tab has been opened
    this._controller.window.addEventListener("TabOpen", checkTabOpened);
    if (animationObserver.isAnimated) {
      this._tabs.getNode().addEventListener("transitionend", checkTabTransitioned);
    }
    else {
      self.transitioned = true;
    }

    switch (type) {
      case "contextMenu":
        var contextMenuItem = new elementslib.ID(this._controller.window.document,
                                                 "context-openlinkintab");
        this._controller.rightClick(aTarget);
        this._controller.click(contextMenuItem);
        utils.closeContentAreaContextMenu(this._controller);
        break;
      case "middleClick":
        this._controller.middleClick(aTarget);
        break;
      default:
        assert.fail("Unknown event type - " + type);
    }

    try {
      assert.waitFor(function () {
        return self.opened && self.transitioned;
      }, "Link has been opened in a new tab");
    }
    finally {
      this._controller.window.removeEventListener("TabOpen", checkTabOpened);
      if (animationObserver.isAnimated) {
        this._tabs.getNode().removeEventListener("transitionend", checkTabTransitioned);
      }
    }
  },

  /**
   * Open a new tab
   *
   * @param {String} [aEventType="menu"] Type of event which triggers the action
   *   <dl>
   *     <dt>menu</dt>
   *     <dd>The main menu is used</dd>
   *     <dt>newTabButton</dt>
   *     <dd>The new tab button on the toolbar is used</dd>
   *     <dt>shortcut</dt>
   *     <dd>The keyboard shortcut is used</dd>
   *     <dt>tabStrip</dt>
   *     <dd>A double click on the tabstrip gets synthesized</dd>
   *   </dl>
   */
  openTab : function tabBrowser_openTab(aEventType) {
    var type = aEventType || "menu";
    var self = {
      opened: false,
      transitioned: false
    };

    function checkTabOpened() { self.opened = true; }
    function checkTabTransitioned() { self.transitioned = true; }

    // Add event listener to wait until the tab has been opened
    this._controller.window.addEventListener("TabOpen", checkTabOpened);
    if (animationObserver.isAnimated) {
     this._tabs.getNode().addEventListener("transitionend", checkTabTransitioned);
    }
    else {
     self.transitioned = true;
    }

    switch (type) {
      case "menu":
        this._controller.mainMenu.click("#menu_newNavigatorTab");
        break;
      case "shortcut":
        var cmdKey = utils.getEntity(this.getDtds(), "tabCmd.commandkey");
        this._controller.keypress(null, cmdKey, {accelKey: true});
        break;
      case "newTabButton":
        var newTabButton = this.getElement({type: "tabs_newTabButton"});
        this._controller.click(newTabButton);
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
      default:
        assert.fail("Unknown event type - " + type);
    }

    try {
      assert.waitFor(function () {
        return self.opened && self.transitioned;
      }, "New tab has been opened");
    }
    finally {
      this._controller.window.removeEventListener("TabOpen", checkTabOpened);
      if (animationObserver.isAnimated) {
        this._tabs.getNode().removeEventListener("transitionend", checkTabTransitioned);
      }
    }
  },

  /**
   * Waits for a particular tab panel element to display and stop animating
   *
   * @param {number} tabIndex
   *        Index of the tab to check
   * @param {string} elemString
   *        Lookup string of the tab panel element
   */
  waitForTabPanel: function tabBrowser_waitForTabPanel(tabIndex, elemString) {
    // Get the specified tab panel element
    var tabPanel = this.getTabPanelElement(tabIndex, elemString);

    // Get the style information for the tab panel element
    var style = this._controller.window.getComputedStyle(tabPanel.getNode(), null);

    // Wait for the top margin to be 0px - ie. has stopped animating
    // TODO: A notification bar starts at a negative pixel margin and drops down
    // to 0px. This creates a race condition where a test may click before the
    // notification bar appears at it's anticipated screen location
    assert.waitFor(function () {
      return style.marginTop == '0px';
    }, "Expected notification bar to be visible: '" + elemString + "' ");
  }
}

// Export of functions
exports.closeAllTabs = closeAllTabs;
exports.getTabsWithURL = getTabsWithURL;

// Export of classes
exports.tabBrowser = tabBrowser;
