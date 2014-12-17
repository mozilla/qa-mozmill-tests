/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The UtilsAPI offers various helper functions for any other API which is
 * not already covered by another shared module.
 *
 * @version 1.0.3
 */

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var { assert, expect } = require("assertions");
var prefs = require("prefs");

/**
 * Get application specific informations
 * @see http://mxr.mozilla.org/mozilla-central/source/xpcom/system/nsIXULAppInfo.idl
 */
var appInfo = {
  /**
   * Get the application info service
   * @returns XUL runtime object
   * @type nsiXULRuntime
   */
  get appInfo() {
    return Services.appinfo;
  },

  /**
   * Get the build id
   * @returns Build id
   * @type string
   */
  get buildID() this.appInfo.appBuildID,

  /**
   * Get the application id
   * @returns Application id
   * @type string
   */
  get ID() this.appInfo.ID,

  /**
   * Get the application name
   * @returns Application name
   * @type string
   */
  get name() this.appInfo.name,

  /**
   * Get the operation system
   * @returns Operation system name
   * @type string
   */
  get os() this.appInfo.OS,

  /**
   * Get the product vendor
   * @returns Vendor name
   * @type string
   */
  get vendor() this.appInfo.vendor,

  /**
   * Get the application version
   * @returns Application version
   * @type string
   */
  get version() this.appInfo.version,

  /**
   * Get the build id of the Gecko platform
   * @returns Platform build id
   * @type string
   */
  get platformBuildID() this.appInfo.platformBuildID,

  /**
   * Get the version of the Gecko platform
   * @returns Platform version
   * @type string
   */
  get platformVersion() this.appInfo.platformVersion,

  /**
   * Get the currently used locale
   * @returns Current locale
   * @type string
   */
  get locale() {
    var registry = Cc["@mozilla.org/chrome/chrome-registry;1"]
                   .getService(Ci.nsIXULChromeRegistry);
    return registry.getSelectedLocale("global");
  },

  /**
   * Get the user agent string
   * @returns User agent
   * @type string
   */
  get userAgent() {
    var window = mozmill.wm.getMostRecentWindow("navigator:browser");
    if (window)
      return window.navigator.userAgent;
    return "";
  },

  /**
   * Get the ABI of the platform
   *
   * @returns {String} ABI version
   */
  get XPCOMABI() this.appInfo.XPCOMABI
};

/**
 * Assert if the current URL is identical to the target URL.
 * With this function also redirects can be tested.
 *
 * @param {MozmillController} aController
 *        MozMillController of the window to operate on
 * @param {string} aTargetUrl
 *        URL to check
 */
function assertLoadedUrlEqual(aController, aTargetUrl) {
  var locationBar = new elementslib.ID(aController.window.document, "urlbar");
  var currentURL = locationBar.getNode().value;

  // Load the target URL
  aController.open(aTargetUrl);
  aController.waitForPageLoad();

  // Check the same web page has been opened
  assert.waitFor(function () {
    return locationBar.getNode().value === currentURL;
  }, "Current URL should be identical to the target URL - expected " + currentURL);
}

/**
 *  Handles the new Australis features
 *
 */
var australis = {

  /**
   * Checks if we use Australis by calling the 'isAustralis' method and returns
   * a String containing either the Australis specific element or a blank String
   *
   * @param {String} aSpec
   *        The name of the library file we target in order to return the
   *        correct string
   *
   * @returns {String} String value for the Australis specific element
   */
  getElement : function australis_getElement(aSpec) {

    switch (aSpec) {
      case "close-button" :
        nodeElem = (this.isAustralis()) ? '/{"class":"messageCloseButton close-icon tabbable"}'
                                        : '/{"class":"messageCloseButton tabbable"}';
        break;
      case "nav-bar-wrapper" :
        nodeElem = (this.isAustralis()) ? '/id("nav-bar-customization-target")' : "";
        break;
      case "tabs" :
        nodeElem = (this.isAustralis()) ? '/id("content-deck")' : "";
        break;
      case "urlbar-wrapper" :
        nodeElem = (this.isAustralis()) ? '/id("urlbar-wrapper")' : "";
        break;
      default :
        assert.fail("Unknown element type - " + aSpec);
    }
    return nodeElem;
  },

  /**
   * Check if we use Australis or not by checking for the presence of a
   * Australis specific element
   *
   * @returns {Boolean} Returns true if we use Australis or false if we don't
   */
  isAustralis : function australis_isAustralis() {
    var controller = mozmill.getBrowserController();
    return !!controller.window.gCustomizeMode;
  }
}

/**
 * Close the context menu inside the content area of the currently open tab
 *
 * @param {MozmillController} aController
 *        MozMillController of the window to operate on
 */
function closeContentAreaContextMenu(aController) {
  var contextMenu = new elementslib.ID(aController.window.document, "contentAreaContextMenu");
  aController.keypress(contextMenu, "VK_ESCAPE", {});
}

/**
 * Create a combined object from proprieties of all passed-in objects
 *
 * @returns {object} The extended object
 */
function combineObjects() {
  var object = {};

  Array.prototype.slice.call(arguments, 0).map(aSource => {
    if (aSource) {
      for (var prop in aSource) {
        object[prop] = aSource[prop];
      }
    }
  });

  return object;
}

/**
 * Run tests against a given search form
 *
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 * @param {ElemBase} aSearchField
 *        The HTML input form element to test
 * @param {string} aSearchTerm
 *        The search term for the test
 * @param {ElemBase} aSubmitButton
 *        (Optional) The forms submit button
 * @param {number} aTimeout
 *        The timeout value for the single tests
 */
function checkSearchField(aController, aSearchField,
                          aSearchTerm, aSubmitButton,
                          aTimeout) {
  aController.waitThenClick(aSearchField, aTimeout);
  aController.type(aSearchField, aSearchTerm);

  if (aSubmitButton != undefined) {
    controller.waitThenClick(aSubmitButton, aTimeout);
  }
}

/**
 * Create a new URI
 *
 * @param {string} aSpec
 *        The URI string in UTF-8 encoding.
 * @param {string} aOriginCharset
 *        The charset of the document from which this URI string originated.
 * @param {string} aBaseURI
 *        If null, spec must specify an absolute URI. Otherwise, spec may be
 *        resolved relative to baseURI, depending on the protocol.
 * @return A URI object
 * @type nsIURI
 */
function createURI(aSpec, aOriginCharset, aBaseURI) {
  return Services.io.newURI(aSpec, aOriginCharset, aBaseURI);
}

/**
 * Empty the clipboard by assigning an empty string
 */
function emptyClipboard() {
  var clipboard = Cc["@mozilla.org/widget/clipboardhelper;1"]
                  .getService(Ci.nsIClipboardHelper);
  clipboard.copyString("");
}

/**
 * Format a URL by replacing all placeholders
 *
 * @param {String} aURL The URL which contains placeholders to replace
 *
 * @returns {String} The formatted URL
 */
function formatUrl(aURL) {
  return Services.urlFormatter.formatURL(aURL);
}

/**
 * Format a URL given by a preference and replace all placeholders
 *
 * @param {String} aPrefName The preference name which contains the URL
 *
 * @returns {String} The formatted URL
 */
function formatUrlPref(aPrefName) {
  return Services.urlFormatter.formatURLPref(aPrefName);
}

/**
 * Returns the default home page
 *
 * @return The URL of the default homepage
 * @type string
 */
function getDefaultHomepage() {
  var prefValue = prefs.getPref("browser.startup.homepage", "",
                                true, Ci.nsIPrefLocalizedString);
  return prefValue.data;
}

/**
 * Returns the value of an individual entity in a DTD file.
 *
 * @param [string] aUrls
 *        Array of DTD urls.
 * @param {string} aEntityId
 *        The ID of the entity to get the value of.
 *
 * @return The value of the requested entity
 * @type string
 */
function getEntity(aUrls, aEntityId) {
  var urls = (typeof aUrls === "string") ? [aUrls] : aUrls;

  // Add xhtml11.dtd to prevent missing entity errors with XHTML files
  urls.push("resource:///res/dtd/xhtml11.dtd");

  // Build a string of external entities
  var extEntities = "";
  for (i = 0; i < urls.length; i++) {
    extEntities += '<!ENTITY % dtd' + i + ' SYSTEM "' +
                   urls[i] + '">%dtd' + i + ';';
  }

  var parser = Cc["@mozilla.org/xmlextras/domparser;1"]
               .createInstance(Ci.nsIDOMParser);
  var header = '<?xml version="1.0"?><!DOCTYPE elem [' + extEntities + ']>';
  var elem = '<elem id="elementID">&' + aEntityId + ';</elem>';
  var doc = parser.parseFromString(header + elem, 'text/xml');
  var elemNode = doc.querySelector('elem[id="elementID"]');

  assert.ok(elemNode, arguments.callee.name + ": Entity - " + aEntityId + " has been found");

  return elemNode.textContent;
}

/**
 * Returns the value of an individual property
 *
 * @param {string[]} aUrls
 *        Array of URLs (or URL) of the string bundle(s)
 * @param {string} aPropertyName
 *        The property to get the value of
 *
 * @returns {string} The value of the requested property
 */
function getProperty(aUrls, aPropertyName) {
  var urls = (typeof aUrls === "string") ? [aUrls] : aUrls;
  var property = null;

  urls.some(aURL => {
    var bundle = Services.strings.createBundle(aURL);
    try {
      property = bundle.GetStringFromName(aPropertyName);
      return true;
    }
    catch (ex) { }
  });

  if (property === null) {
    assert.fail("Unknown property - " + aPropertyName);
  }

  return property;
}

/**
 * Checks the visibility of an element.
 *
 * Bug 490548
 * A test should fail if an element we operate on is not visible
 *
 * @param {MozmillController} aController
 *        MozMillController of the window to operate on
 * @param {ElemBase} aElem
 *        Element to check its visibility
 */
function isDisplayed(aController, aElem) {
  // If the element doesn't exists we return early
  if (!aElem.exists()) {
    return false;
  }

  var element = aElem.getNode();
  var visible;

  switch (element.nodeName) {
    case 'panel':
      visible = (element.state === 'open');
      break;
    default:
      var style = aController.window.getComputedStyle(element, '');
      var visibility = style.getPropertyValue('visibility');
      var display = style.getPropertyValue('display');
      var width = parseInt(style.getPropertyValue('width'), 10);
      var height = parseInt(style.getPropertyValue('height'), 10);

      visible = (display !== 'none') &&
                (visibility === 'visible') &&
                (width > 0) && (height > 0)
  }

  return visible;
}

/**
 * Helper function to remove a permission
 *
 * @param {string} aHost
 *        The host whose permission will be removed
 * @param {string} aType
 *        The type of permission to be removed
 */
function removePermission(aHost, aType) {
  Services.perms.remove(aHost, aType);
}

/**
 * Returns the value of a CSS Property for a specific Element
 *
 * @param {ElemBase} aElement
 *        Element to get its property
 * @param {String} aProperty
 *        Property name to be retrieved
 *
 * @return {String} Value of the CSS property
 */
function getElementStyle(aElement, aProperty) {
  var element = aElement.getNode();
  assert.ok(element, arguments.callee.name + " Element " + aElement.getInfo() + " has been found");

  var elementStyle = element.ownerDocument.defaultView.getComputedStyle(element);
  return elementStyle.getPropertyValue(aProperty);
}

/**
 * Sanitize user data, this clears cache, cookies, offlineApps, history,
 * formdata, downloads, passwords, sessions, siteSettings
 *
 * Usage:
 * sanitize(); // Will clear all user data
 * sanitize({ downloads: true }); // Will clear downloads only
 *
 * @param {object} [aSpec]
 *        Information about the data to be cleared
 *        If undefined, all data will be cleared
 * @param {boolean} [aSpec.cache=false]
 *        If true cache will be cleared
 * @param {boolean} [aSpec.cookies=false]
 *        If true cookies will be cleared
 * @param {boolean} [aSpec.downloads=false]
 *        If true downloads history will be cleared
 * @param {boolean} [aSpec.formdata=false]
 *        If true form-data history will be cleared
 * @param {boolean} [aSpec.history=false]
 *        If true browsing history will be cleared
 * @param {boolean} [aSpec.offlineApps=false]
 *        If true offlineApps data will be cleared
 * @param {boolean} [aSpec.passwords=false]
 *        If true persisted passwords will be cleared
 * @param {boolean} [aSpec.sessions=false]
 *        If true session storage will be cleared
 * @param {boolean} [aSpec.siteSettings=false]
 *        If true site settings will be cleared
 */
function sanitize(aSpec) {
  var spec = (typeof aSpec === "undefined") ? {} : {
    cache: aSpec.cache || false,
    cookies: aSpec.cookies || false,
    downloads: aSpec.downloads || false,
    formdata: aSpec.formdata || false,
    history: aSpec.history || false,
    offlineApps: aSpec.offlineApps || false,
    passwords: aSpec.passwords || false,
    sessions: aSpec.sessions || false,
    siteSettings: aSpec.siteSettings || false
  };

  // Load the sanitize script
  var tempScope = {};
  Cc["@mozilla.org/moz/jssubscript-loader;1"]
  .getService(Ci.mozIJSSubScriptLoader)
  .loadSubScript("chrome://browser/content/sanitize.js", tempScope);

  // Instantiate the Sanitizer
  var s = new tempScope.Sanitizer();
  s.prefDomain = "privacy.cpd.";
  var itemPrefs = Services.prefs.getBranch(s.prefDomain);

  // Apply options for what to sanitize
  for (var pref in spec) {
    itemPrefs.setBoolPref(pref, spec[pref]);
  };

  try {
    // Sanitize and wait for the promise to resolve
    var finished = false;
    s.sanitize().then(() => {
      finished = true;
    }, aError => {
      throw aError;
    });
    assert.waitFor(() => finished);
  }
  catch (e) {
    assert.fail("Failed to sanitize users data: " + e);
  }
  finally {
    // Restore prefs to default
    for (let pref in spec) {
      itemPrefs.clearUserPref(pref);
    };
  }
}

/**
 * Helper function to ping the blocklist Service so Firefox updates the blocklist
 *
 * @param {Boolean} [aWait=true]
 *        If true, wait for the 'blocklist-updated' observer topic
 */
function updateBlocklist(aWait) {
  var wait = (aWait === undefined || aWait === null) ? true
                                                     : aWait;
  var done = false;

  function updated() { done = true; }
  Services.obs.addObserver(updated, "blocklist-updated", false);

  try {
    var blocklistService = Cc["@mozilla.org/extensions/blocklist;1"]
                           .getService(Ci.nsIBlocklistService);
    blocklistService.QueryInterface(Ci.nsITimerCallback).notify(null);

    if (wait) {
      expect.waitFor(function () {
        return done;
      }, "Blocklist has been updated.")
    }
  }
  finally {
    Services.obs.removeObserver(updated, "blocklist-updated");
  }
}

// Export of variables
exports.appInfo = appInfo;

// Export of functions
exports.assertLoadedUrlEqual = assertLoadedUrlEqual;
exports.australis = australis;
exports.checkSearchField = checkSearchField;
exports.closeContentAreaContextMenu = closeContentAreaContextMenu;
exports.combineObjects = combineObjects;
exports.createURI = createURI;
exports.emptyClipboard = emptyClipboard;
exports.formatUrl = formatUrl;
exports.formatUrlPref = formatUrlPref;
exports.getDefaultHomepage = getDefaultHomepage;
exports.getElementStyle = getElementStyle;
exports.getEntity = getEntity;
exports.getProperty = getProperty;
exports.isDisplayed = isDisplayed;
exports.removePermission = removePermission;
exports.sanitize = sanitize;
exports.updateBlocklist = updateBlocklist;
