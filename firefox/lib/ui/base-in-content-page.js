/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var tabs = require("../tabs");
var utils = require("../../../lib/utils");

/**
 * Base In-Content page class
 * @abstract
 * @constructor
 *
 * @param {object} aBrowserWindow
 *        Browser window where the page lives
 */
function BaseInContentPage(aBrowserWindow) {
  assert.ok(aBrowserWindow, "Browser window has been specified");

  this._browserWindow = aBrowserWindow;
  this._contentWindow = null;

  this._dtds = [];
  this._type = "";
}

BaseInContentPage.prototype = {
  /**
   * Returns the browser window of the page
   *
   * @returns {object} The browser window instance
   */
  get browserWindow() {
    return this._browserWindow;
  },

  /**
   * Returns the content window of the page
   *
   * @returns {object} The content window instance
   */
  get contentWindow() {
    return this._contentWindow;
  },

  /**
   * Get list of required DTD locations
   *
   * @returns {string[]} Array of external DTD urls
   */
  get dtds() {
    return this._dtds;
  },

  /**
   * Check that the page is open
   *
   * @returns {boolean} True if the page is open, false otherwise
   */
  get isOpen() {
    return this.tabs.length !== 0;
  },

  /**
   * Get all the tabs containing this page's URL
   * This will most likely get overwritten in the inherited classes
   * depending on how we will search for the page state
   *
   * @returns {ElemBase[]} Array of tabs
   */
  get tabs() {
    if (this.contentWindow && !this.contentWindow.closed) {
      return tabs.getTabsWithURL(this.url);
    }
    return [];
  },

  /**
   * Get the URL of the page
   *
   * @returns {string} URL of the page
   */
  get url() {
    return this.contentWindow ? this.contentWindow.location.href : null;
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
   *        Parent of the element
   *
   * @returns {ElemBase} Element which has been found
   */
  getElement: function BICP_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @abstract
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   * @param {string} aSpec.type
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
  getElements: function BICP_getElements(aSpec) {
    return [];
  },

  /**
   * Close the page
   *
   * @param {function} [aCallback=this._browserWindow.tabs.closeTab()]
   *        Callback to close the page
   */
  close: function BICP_close(aCallback) {
    if (!this.contentWindow || this.contentWindow.closed) {
      assert.fail("Content window has been found");
    }

    // Handle the case when only one tab is visible
    // Opening a new tab allows to close the BICP tab with one of the method below
    if (this.browserWindow.tabs.length === 1) {
      let newTabURL = this.browserWindow.controller.window.BROWSER_NEW_TAB_URL;
      this.browserWindow.tabs.openTab(newTabURL);
    }

    this.browserWindow.tabs.selectedIndex = this.tabs[0].index;
    this._contentWindow = null;

    if (typeof aCallback === "function") {
      aCallback();
    }
    else {
      this.browserWindow.tabs.closeTab();
    }
  },

  /**
   * Open the page
   *
   * @param {function} aCallback
   *        Callback to open the page
   */
  open: function BICP_open(aCallback) {
    assert.equal(typeof aCallback, "function", "Callback has been defined");

    if (this.isOpen) {
      aCallback();
      // Bug 1071566
      // Add new method in the the tabBrowser class to handle the TabSelect event
      // Replace code with the method which will get the callback as a parameter
      var pageTab = this.tabs[0];
      assert.waitFor(() => (this.browserWindow.tabs.selectedIndex === pageTab.index),
                     "The tab with index '" + pageTab.index + "' has been selected");
    }
    else {
      this.browserWindow.tabs.openTab({method: "callback", callback: aCallback});
      this.browserWindow.controller.waitForPageLoad();
    }

    this._contentWindow = this.browserWindow.controller.tabs.activeTab.defaultView;
  }
};

// Export of classes
exports.BaseInContentPage = BaseInContentPage;
