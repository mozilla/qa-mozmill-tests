/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm");

// Include required modules
var tabs = require("../tabs");
var toolbars = require("../toolbars");
var windows = require("../../../lib/windows");

var aboutAccounts = require("about-accounts-page");
var aboutPreferences = require("about-preferences-page");
var aboutWindow = require("about-window");
var baseWindow = require("../../../lib/ui/base-window");
var pageInfo = require("page-info");
var placesOrganizer = require("places-organizer");
var unknownContentTypeDialog = require("unknown-content-type-dialog");

/**
 * Browser Window class
 *
 * @constructor
 * @param {MozMillController} [aController=mozmill.getBrowserController()]
 *        MozMillController of the Browser
 */
function BrowserWindow(aController) {
  this._controller = aController || mozmill.getBrowserController();
  this._dtds = ["chrome://branding/locale/brand.dtd",
                "chrome://browser/locale/browser.dtd",
                "chrome://browser/locale/aboutPrivateBrowsing.dtd"];
  this._properties = ["chrome://browser/locale/browser.properties"];
  this._tabs = null;
  this._navBar = null;
}

BrowserWindow.prototype = new baseWindow.BaseWindow(true);
BrowserWindow.prototype.constructor = BrowserWindow;

BrowserWindow.prototype.__defineGetter__('private', function () {
  return PrivateBrowsingUtils.isWindowPrivate(this._controller.window)
});

/**
 * Get the tabBrowser of the current browser window
 *
 * @returns {object} Tab browser of the window
 */
BrowserWindow.prototype.__defineGetter__('tabs', function () {
  return this._tabs = this._tabs || new tabs.tabBrowser(this._controller);
});

/**
 * Get the navigation bar of the current browser window
 *
 * @returns {object} navBar of the window
 */
BrowserWindow.prototype.__defineGetter__('navBar', function () {
  return this._navBar = this._navBar || new toolbars.NavBar(this);
});

/**
 * Open a new Browser Window
 *
 * @param {string} aSpec
 *        Information about opening the new window
 * @param {string} [aSpec.method=menu]
 *        Method to use ("menu", "shortcut" or "callback")
 * @param {boolean} [aSpec.private=false]
 *        Value to check if a private window to open is needed
 * @param {function} [aCallback]
 *        The callback handler to use for opening the window
 *
 * @returns {BrowserWindow} A new instance of the BrowserWindow
 */
BrowserWindow.prototype.open = function BrowserWindow_open(aSpec, aCallback) {
  var spec = aSpec || {};
  var method = spec.method || "menu";
  var menuItem = "";
  var cmdKey = "";
  var shiftKey = false;

  if (spec.private) {
    menuItem = "#menu_newPrivateWindow";
    cmdKey = this.getEntity("privateBrowsingCmd.commandkey");
    shiftKey = true;
  }
  else {
    menuItem = "#menu_newNavigator";
    cmdKey = this.getEntity("newNavigatorCmd.key");
  }

  var controller = windows.waitForWindowState(() => {
    switch (method) {
      case "menu":
        this._controller.mainMenu.click(menuItem);
        break;
      case "shortcut":
        this._controller.keypress(null, cmdKey,
                                  {accelKey: true, shiftKey: shiftKey});
        break;
      case "callback":
        assert.equal(typeof aCallback, "function",
                     "Callback has been specified");
        aCallback(this._controller);
        break;
      default:
        assert.fail("Unknown opening method - " + method);
    }
  }, {state: "open", type: "navigator:browser"});

  var newWindow = new BrowserWindow(controller);

  if (spec.private) {
    assert.ok(newWindow.private, "A new private window has been opened");
    // Bug 847991
    // We need to wait for the about:privatebrowsing page to load,
    // otherwise it might load _after_ we try loading another page
    newWindow.controller.waitForPageLoad();
  }

  return newWindow;
};

/**
 * Open the page info window
 *
 * @param {object} [aSpec]
 *        Information for opening the window
 * @param {function} [aSpec.callback]
 *        Callback function that triggers the opening
 * @param {string} [aSpec.method="menu"]
 *        Method to use ("callback", "contextMenu", "menu", "shortcut")
 * @param {ElemBase} [aSpec.target]
 *        Element to use as a target when using the contextMenu method
 *
 * @returns {PageInfoWindow} New instance of the PageInfoWindow class
 */
BrowserWindow.prototype.openPageInfoWindow = function BW_openPageInfoWindow(aSpec={}) {
  var method = aSpec.method || "menu";

  var callback = () => {
    switch (method) {
      case "callback":
        assert.equal(typeof aSpec.callback, "function",
                     "Callback has been defined");
        aSpec.callback();
        break;
      case "contextMenu":
        assert.ok(aSpec.target, "Target element has been defined");

        var contextMenu = this._controller.getMenu("#contentAreaContextMenu");
        contextMenu.select("#context-viewinfo", aSpec.target);
        contextMenu.close();
        break;
      case "menu":
        this._controller.mainMenu.click("#menu_pageInfo");
        break;
      case "shortcut":
        var cmdKey = this.getEntity("pageInfoCmd.commandkey");
        this._controller.keypress(null, cmdKey, {accelKey: true});
        break;
      default:
        assert.fail("Unknown method to open the page info window - " + method);
    }
  }

  return pageInfo.open(callback);
};

/**
 * Open the about:preferences in-content page
 *
 * @params {object} [aSpec={}]
 *         Information about opening the page
 * @params {function} [aSpec.method="menu"]
 *         Method to use when opening the Preferences page
 *         ("menu"|"shortcut"|"menuPanel"|"callback")
 * @params {function} [aSpec.callback]
 *         Callback that opens the page
 * @params {string} [aSpec.pane="general"]
 *         Pane to focus after opening the preferences page
 *
 * @returns {PreferencesPage} Instance of an PreferencesPage object
 */
BrowserWindow.prototype.openAboutPreferencesPage = function BW_openAboutPreferencesPage(aSpec={}) {
  var method = aSpec.method || "menu";

  var callback = () => {
    switch (method) {
      case "callback":
        assert.equal(typeof aSpec.callback, "function",
                     "Callback has been defined");

        aSpec.callback();
        break;
      case "menu":
        this.controller.mainMenu.click("#menu_preferences");
        break;
      case "shortcut":
        if (mozmill.isMac) {
          var cmdKey = this.getEntity( "preferencesCmdMac.commandkey");
          this.controller.keypress(null, cmdKey, {accelKey: true});
        }
        else {
          // Shortcuts only avaible on Mac OSX for the moment
          assert.fail("Opening the Preferences via shortcut is only available on OSX");
        }
        break;
      default:
        assert.fail("Unknown event type - " + method);
    }
  }

  var prefsPage = new aboutPreferences.AboutPreferencesPage(this);
  prefsPage.open(callback);

  return prefsPage;
};

/**
 * Open the about:accounts in-content page
 *
 * @params {object} [aSpec={}]
 *         Information about opening the page
 * @params {string} [aSpec.method]
 *         Method to use when opening
 * @params {function} [aSpec.callback]
 *         Callback that opens the page
 *
 * @returns {PreferencesPage} Instance of an PreferencesPage object
 */
BrowserWindow.prototype.openAboutAccountsPage = function BW_openAboutAccountsPage(aSpec={}) {
  var method = aSpec.method || "menu";

  // Define the callback that opens the in-content page
  var callback = () => {
    switch (method) {
      case "callback":
        assert.equal(typeof aSpec.callback, "function",
                     "Callback has been defined");
        aSpec.callback();
      case "menu":
        this.controller.mainMenu.click("#sync-setup");
        break;
      default:
        assert.fail("Unknown method - " + method);
    }
  };

  var accountsPage = new aboutAccounts.AboutAccountsPage(this);
  accountsPage.open(callback);

  return accountsPage;
};

/**
 * Open the places organizer window
 *
 * @param {object} [aSpec]
 *        Information for opening the window
 * @param {string} [aSpec.type="shortcut"]
 *        How to open the Library Window ("menu", "shortcut")
 * @param {string} [aSpec.location="bookmarks"]
 *        Which pane to be selected after opening the window
 *        ("bookmarks", "downloads", "history", "tags")
 *
 * @returns {PlacesOrganizerWindow} New instance of PlacesOrganizerWindow
 */
BrowserWindow.prototype.openPlacesOrganizer = function BW_openPlacesOrganizer(aSpec={}) {
  var type = aSpec.type || "shortcut";
  var location = aSpec.location || "bookmarks";
  var shiftKey = true;
  var cmdKey = null;
  var menuItem = null;

  switch (location) {
    case "bookmarks":
      if (mozmill.isLinux) {
        cmdKey = this.getEntity("bookmarksGtkCmd.commandkey");
      }
      else {
        cmdKey = this.getEntity("bookmarksCmd.commandkey");
      }
      menuItem = "#bookmarksShowAll";
      break;
    case "downloads":
      if (mozmill.isLinux) {
        cmdKey = this.getEntity("downloadsUnix.commandkey");
      }
      else {
        cmdKey = this.getEntity("downloads.commandkey");
        shiftKey = false;
      }
      menuItem = "#menu_openDownloads";
      break;
    case "history":
      cmdKey = this.getEntity("showAllHistoryCmd.commandkey");
      menuItem = "#menu_showAllHistory";
      break;
    case "tags":
      assert.fail("Opening the pane 'Tags' directly is not supported yet");
      break;
    default:
      assert.fail("Unknown library location - " + location);
  }

  var callback = () => {
    switch (type) {
      case "menu":
        this._controller.mainMenu.click(menuItem);
        break;
      case "shortcut":
        this._controller.keypress(null, cmdKey, {accelKey: true,
                                                 shiftKey: shiftKey});
        break;
      default:
        assert.fail("Unknown event type - " + type);
    }
  };

  return placesOrganizer.open(callback);
};

/**
 * Open the About window
 *
 * @param {object} [aSpec]
 *        Information for opening the window
 * @param {string} [aSpec.type="menu"|"callback"]
 *        How to open the About Window
 */
BrowserWindow.prototype.openAboutWindow = function BW_openAboutWindow(aSpec={}) {
  var type = aSpec.type || "menu";

  var callback = () => {
    switch (type) {
      case "menu":
        this._controller.mainMenu.click("#aboutName");
        break;
      case "callback":
        assert.ok(aSpec.callback && (typeof aSpec.callback === "function"),
                  "A callback for opening About Window has ben provided.");
        aSpec.callback();
        break;
      default:
        assert.fail("Unknown event type - " + type);
    }
  };

  return aboutWindow.open(callback);
};

/**
 * Open the unknown content type dialog
 *
 * @param {string} aURL
 *         URL of the file which has to be downloaded
 */
BrowserWindow.prototype.openUnknownContentTypeDialog = function BW_openUCTD(aCallback) {
  return unknownContentTypeDialog.open(aCallback);
};

// Export of methods
exports.BrowserWindow = BrowserWindow;
