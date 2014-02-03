/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The SessionStoreAPI adds support for accessing session related elements and features
 *
 * @version 1.0.0
 */

// Include required modules
var { assert } = require("../../lib/assertions");
var prefs = require("prefs");
var utils = require("utils");
var widgets = require("widgets");

// Session Store service
var sessionStoreService = Cc["@mozilla.org/browser/sessionstore;1"]
                             .getService(Ci.nsISessionStore);

// Preference for indicating the amount of restorable tabs
const SESSIONSTORE_MAXTABS_PREF = 'browser.sessionstore.max_tabs_undo';

/**
 * Constructor
 *
 * @param {MozMillController} controller
 *        MozMill controller of the browser window to operate on.
 */
function aboutSessionRestore(controller) {
  this._controller = controller;
}

/**
 * This class handles the about:sessionrestore page.
 */
aboutSessionRestore.prototype = {
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
   * Returns the tree which contains the windows and tabs
   *
   * @returns Tree with windows and tabs to restore
   * @type {ElemBase}
   */
  get tabList() {
    return this.getElement({type: "tabList"});
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function aboutSessionRestore_getDtds() {
    var dtds = ["chrome://browser/locale/aboutSessionRestore.dtd"];
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
  getElement : function aboutSessionRestore_getElement(spec) {
    var elem = null;

    switch(spec.type) {
      case "button_restoreSession":
        elem = new elementslib.ID(this._controller.tabs.activeTab, "errorTryAgain");
        break;
      case "error_longDesc":
        elem = new elementslib.ID(this._controller.tabs.activeTab, "errorLongDesc");
        break;
      case "error_pageContainer":
        elem = new elementslib.ID(this._controller.tabs.activeTab, "errorPageContainer");
        break;
      case "error_shortDesc":
        elem = new elementslib.ID(this._controller.tabs.activeTab, "errorShortDescText");
        break;
      case "error_title":
        elem = new elementslib.ID(this._controller.tabs.activeTab, "errorTitleText");
        break;
      case "tabList":
        elem = new elementslib.ID(this._controller.window.document, "tabList");
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return elem;
  },

  /**
   * Returns the current restore state of the given element
   *
   * @param {object} element
   *        Element which restore state should be retrieved
   * @returns True if the element should be restored
   * @type {boolean}
   *
   */
  getRestoreState : function aboutSessionRestore_getRestoreState(element) {
    var tree = this.tabList.getNode();

    return tree.view.getCellValue(element.listIndex, tree.columns.getColumnAt(0));
  },

  /**
   * Get restorable tabs under the given window
   *
   * @param {object} window
   *        Window inside the tree
   * @returns List of tabs
   * @type {array of object}
   */
  getTabs : function aboutSessionRestore_getTabs(window) {
    var tabs = [ ];
    var tree = this.tabList.getNode();

    // Add entries when they are tabs (no container)
    var ii = window.listIndex + 1;
    while (ii < tree.view.rowCount && !tree.view.isContainer(ii)) {
      tabs.push({
                 index: tabs.length,
                 listIndex : ii,
                 restore: tree.view.getCellValue(ii, tree.columns.getColumnAt(0)),
                 title: tree.view.getCellText(ii, tree.columns.getColumnAt(2))
                });
      ii++;
    }

    return tabs;
  },

  /**
   * Get restorable windows
   *
   * @returns List of windows
   * @type {array of object}
   */
  getWindows : function aboutSessionRestore_getWindows() {
    var windows = [ ];
    var tree = this.tabList.getNode();

    for (var ii = 0; ii < tree.view.rowCount; ii++) {
      if (tree.view.isContainer(ii)) {
        windows.push({
                      index: windows.length,
                      listIndex : ii,
                      open: tree.view.isContainerOpen(ii),
                      restore: tree.view.getCellValue(ii, tree.columns.getColumnAt(0)),
                      title: tree.view.getCellText(ii, tree.columns.getColumnAt(2))
                     });
      }
    }

    return windows;
  },

  /**
   * Toggles the restore state for the element
   *
   * @param {object} element
   *        Specifies the element which restore state should be toggled
   */
  toggleRestoreState : function aboutSessionRestore_toggleRestoreState(element) {
    var state = this.getRestoreState(element);

    widgets.clickTreeCell(this._controller, this.tabList, element.listIndex, 0, {});
    this._controller.sleep(0);

    assert.notEqual(this.getRestoreState(element), state, "Restore state has been toggled");
  }
}

/**
 * Resets the list of recently closed tabs by setting and clearing the user preference
 */
function resetRecentlyClosedTabs()
{
  prefs.preferences.setPref(SESSIONSTORE_MAXTABS_PREF, 0);
  prefs.preferences.clearUserPref(SESSIONSTORE_MAXTABS_PREF);
}

/**
 * Returns the number of restorable tabs for a given window
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 * @returns The number of restorable tabs in the window
 */
function getClosedTabCount(controller)
{
  return sessionStoreService.getClosedTabCount(controller.window);
}

/**
 * Restores the tab which has been recently closed
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 * @param {object} event
 *        Specifies the event to use to execute the command
 */
function undoClosedTab(controller, event)
{
  var count = sessionStoreService.getClosedTabCount(controller.window);
  var dtds = ["chrome://browser/locale/browser.dtd"];

  switch (event.type) {
    case "menu":
      assert.fail("Menu gets build dynamically and cannot be accessed.");
      break;
    case "shortcut":
      var cmdKey = utils.getEntity(dtds, "tabCmd.commandkey");
      controller.keypress(null, cmdKey, {accelKey: true, shiftKey: true});
      break;
  }

  if (count > 0) {
    assert.ok(sessionStoreService.getClosedTabCount(controller.window) < count,
              "Closed tab count is lower");
  }
}

/**
 * Restores the window which has been recently closed
 *
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 * @param {object} event
 *        Specifies the event to use to execute the command
 */
function undoClosedWindow(controller, event)
{
  var count = sessionStoreService.getClosedWindowCount(controller.window);
  var dtds = ["chrome://browser/locale/browser.dtd"];

  switch (event.type) {
    case "menu":
      assert.fail("Menu gets build dynamically and cannot be accessed.");
      break;
    case "shortcut":
      var cmdKey = utils.getEntity(dtds, "newNavigatorCmd.key");
      controller.keypress(null, cmdKey, {accelKey: true, shiftKey: true});
      break;
  }

  if (count > 0)
    assert.ok(sessionStoreService.getClosedWindowCount(controller.window) < count, "Closed window count is lower");
}

// Export of functions
exports.getClosedTabCount = getClosedTabCount;
exports.resetRecentlyClosedTabs = resetRecentlyClosedTabs;
exports.undoClosedTab = undoClosedTab;
exports.undoClosedWindow = undoClosedWindow;

// Export of classes
exports.aboutSessionRestore = aboutSessionRestore;
