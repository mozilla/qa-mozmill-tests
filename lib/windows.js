/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var { assert } = require("assertions");
var modalDialog = require("modal-dialog");
var utils = require("utils");

const OBSERVER_WINDOW_DESTROYED = "outer-window-destroyed";
const OBSERVER_WINDOW_READY = "toplevel-window-ready";
const OBSERVER_PAGE_INFO_LOADED = "page-info-dialog-loaded";

const WINDOW_STATES = {
  closed: "closed",
  open: "open"
}

/**
 * Observer class for handling different notifications of windows
 * @constructor
 *
 * @param {ChromeWindow} [aWindow]
 *        Window to observe
 */
function WindowsObserver(aWindow) {
  this._windows = aWindow ? [aWindow] : [];
}

WindowsObserver.prototype = {
  /**
   * Get the state of a window
   *
   * @returns {string} State of the window given by notification observers
   */
  getWindowState : function WindowsObserver_getWindowState(aWindow) {
    return (this._windows.indexOf(aWindow) !== -1) ? WINDOW_STATES.open
                                                   : WINDOW_STATES.closed;
  },

  /**
   * Get the list of opened windows since we instantiated the observer
   *
   * @returns {[ChromeWindow]} Array of windows
   */

  getWindows : function WindowsObserver_getWindows() {
    return this._windows;
  },

  /**
   * Observes the registered notification topics
   *
   * @param {string} aSubject
   *        The object whose change or action is being observed.
   * @param {string} aTopic
   *        The specific taken action ("open" or "closed")
   * @param {string} aData
   *        Additional data describing the notification.
   */
  observe : function WindowsObserver_observe(aSubject, aTopic, aData) {
    switch (aTopic) {
      case OBSERVER_WINDOW_DESTROYED:
        this._windows.splice(this._windows.indexOf(aSubject), 1);
        break;
      case OBSERVER_WINDOW_READY:
      case OBSERVER_PAGE_INFO_LOADED:
        this._windows.push(aSubject);
        break;
      }
  }
}

/**
 * Close all windows
 *
 * @param {BaseWindow|MozMillController} [aObject={}]
 *        Window or controller of the window which will not be closed
 */
function closeAllWindows(aObject={}) {
  var aController = aObject.controller || aObject;

  // Close all windows except the
  // hiddenDOMWindow and the one handled by aController if not null
  var windows = mozmill.utils.getWindows();
  windows.forEach((aWindow, aIndex) => {
    if (aWindow !== aController.window &&
        aWindow !== Services.appShell.hiddenDOMWindow) {
      waitForWindowState(() => { aWindow.close(); },
                         {state: WINDOW_STATES.closed, window: aWindow});
    }
  });
}

/**
 * Function to handle non-modal windows
 *
 * @param {string} aType
 *        Specifies how to check for the new window ("type" or "title")
 * @param {string} aText
 *        The window type of title string to search for
 * @param {function} [aCallback]
 *        Callback function to call for window specific tests
 * @param {boolean} [aClose=true]
 *        Make sure the window is closed after the return from the callback handler
 *
 * @returns {MozMillController}
            The MozMillController of the window (if the window hasn't been closed)
 */
function handleWindow(aType, aText, aCallback, aClose=true) {
  var window = null;

  // Set the window opener function to use depending on the type
  var func_ptr = null;
  switch (aType) {
    case "title":
      func_ptr = mozmill.utils.getWindowByTitle;
      break;
    case "type":
      func_ptr = mozmill.utils.getWindowByType;
      break;
    default:
      assert.fail("Unknown opener type - " + aType);
  }

  try {
    // Wait until the window has been opened
    assert.waitFor(() => {
      window = func_ptr(aText);
      return !!window;
    }, "Window has been found.");

    // Get the controller for the newly opened window
    var controller = new mozmill.controller.MozMillController(window);
    var windowId = mozmill.utils.getWindowId(window);

    // Call the specified callback method for the window
    if (aCallback) {
      aCallback(controller);
    }

    // Close the window if necessary and wait until it has been unloaded
    if (aClose && window) {
      try {
        window.close();
        assert.waitFor(() => !mozmill.controller.windowMap.contains(windowId),
                       "Window has been closed.");
      }
      catch (e if e instanceof TypeError) {
        // The test itself has already destroyed the window. Also the object is
        // not available anymore because it has been marked as dead. We can fail
        // silently.
      }

      controller = null;
    }

    return controller;
  }
  catch (e) {
    try {
      if (window)
        window.close();
    }
    catch (ex if ex instanceof TypeError) {
      // The window object is not available anymore because it has been marked
      // as dead. We can fail silently.
    }

    throw e;
  }
}

/**
 * Wait for a window state
 *
 * @param {function} aCallback
 *        Callback function that triggers the window's state changing
 * @param {object} aSpec
 *        Information about the window to handle
 * @param {string} [aSpec.id]
 *        Id of the window
 * @param {string} aSpec.state
 *        The expected state of the window to wait for
 * @param {string} [aSpec.type]
 *        Type of the window
 * @param {string} [aSpec.observer]
 *        Observer notification to wait for
 * @param {ChromeWindow} [aSpec.window]
 *        The window we are waiting for
 */
function waitForWindowState(aCallback, aSpec={}) {
  assert.equal(typeof aCallback, "function",  "Callback has been specified");
  assert.ok(aSpec.state, "State has been specified");

  var aEventType = aSpec.observer || OBSERVER_WINDOW_READY;
  if (aSpec.state === WINDOW_STATES.open) {
    assert.ok(aSpec.type || aSpec.id,
              "Type or ID of the window to open has been specified");
  }
  else {
    assert.ok(aSpec.window, "Window has been specified");
    aEventType = OBSERVER_WINDOW_DESTROYED;
  }

  var controller = null;

  var observer = new WindowsObserver(aSpec.window);
  Services.obs.addObserver(observer, aEventType, false);

  try {
    aCallback();

    if (aSpec.state === WINDOW_STATES.open) {
      assert.waitFor(() => {
        return observer.getWindows().some(aWindow => {
          var windowType = aWindow.document.documentElement.getAttribute("windowtype");
          var windowId = aWindow.document.documentElement.id;
          if (windowType === aSpec.type || windowId === aSpec.id) {
            controller = new mozmill.controller.MozMillController(aWindow);
          }
          return !!controller;
        });
      }, "Window has been opened");
    }
    else {
      assert.waitFor(() => (observer.getWindowState(aSpec.window) === aSpec.state),
                     "Window has been " + aSpec.state);
    }
  }
  catch (ex) {
    ex.message = "Expected window state has been reached - " + aSpec.state +
                 " (" + ex.message + ")" ;
    throw ex;
  }
  finally {
    Services.obs.removeObserver(observer, aEventType);
  }

  return controller;
}

// Export of variables
exports.WINDOW_STATES = WINDOW_STATES;

// Export of functions
exports.closeAllWindows = closeAllWindows;
exports.handleWindow = handleWindow;
exports.waitForWindowState = waitForWindowState;
