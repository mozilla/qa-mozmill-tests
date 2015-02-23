/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var domUtils = require("../../../lib/dom-utils");
var prefs = require("../../../lib/prefs");

var baseInContentPage = require("base-in-content-page");

const PREF_NEWTAB_PRELOAD = "browser.newtab.preload";

/**
 * 'About Newtab' in content page class
 * @constructor
 *
 * @param {object} aBrowserWindow
 *        Browser window where the page lives
 */
function AboutNewtabPage(aBrowserWindow) {
  baseInContentPage.BaseInContentPage.call(this, aBrowserWindow);
}

AboutNewtabPage.prototype = Object.create(baseInContentPage.BaseInContentPage.prototype);
AboutNewtabPage.prototype.constructor = AboutNewtabPage;

/**
 * Opens the "What is this page?" panel
 *
 * @param {function} [aCallback]
 *         Callback to open the "What is this page?" panel
 *
 * @return {object} "What is this page?" panel
 */
AboutNewtabPage.prototype.openWhatIsThisPage = function ANTP_openWhatIsThisPage(aCallback) {
  var callback = () => {
    // Click on "What is this page?" element
    var link = this.getElement({type: "whatIsThisPage"});
    link.waitThenClick();
  };

  callback = aCallback || callback;

  var attrModified = false;
  var popupShown = false;
  function onAttrModified() { attrModified = true; }
  function onPopupShown() { popupShown = true; }

  this.browserWindow.controller.window.addEventListener("DOMAttrModified", onAttrModified);
  this.browserWindow.controller.window.addEventListener("popupshowing", onPopupShown);
  try {
    callback();
    assert.waitFor(() => (popupShown && attrModified),
                   "'What is this page?' popup is open");
  }
  finally {
    this.browserWindow.controller.window.removeEventListener("DOMAttrModified", onAttrModified);
    this.browserWindow.controller.window.removeEventListener("popupshowing", onPopupShown);
  }

  return this.getElement({type: "introPanel"});
}

/**
 * Open the about:newtab in-content page
 *
 * @params {object} [aSpec={}]
 *         Information about opening the page
 * @params {function} [aSpec.callback]
 *         Callback that triggers the opening
 * @params {string} [aSpec.method="menu"]
 *         Method to use when opening the AboutNewtabPage ("menu", "callback")
 */
AboutNewtabPage.prototype.open = function ANTP_open(aSpec={}) {
  // TODO: Bug 1120906
  // waitForPageLoad fails after opening "about:newtab" when
  // "browser.newtab.preload" preference is set to true
  prefs.setPref(PREF_NEWTAB_PRELOAD, false);

  var method = aSpec.method || "menu";

  // Define the callback that opens the in-content page
  var callback = () => {
    switch (method) {
      case "callback":
        assert.equal(typeof aSpec.callback, "function",
                     "Callback has been defined");
        aSpec.callback();
        break;
      case "menu":
        this.browserWindow.controller.mainMenu.click("#menu_newNavigatorTab");
        break;
      case "shortcut":
        var cmdKey = this.browserWindow.getEntity("tabCmd.accesskey");
        this.browserWindow.controller.keypress(null, cmdKey, {accelKey: true});
        break;
      default:
        assert.fail("Unknown method - " + method);
    }
  }

  try {
    baseInContentPage.BaseInContentPage.prototype.open.call(this, callback);
  }
  finally {
    // TODO: Bug 1120906
    prefs.clearUserPref(PREF_NEWTAB_PRELOAD);
  }
};

/**
 * Retrieve list of UI elements based on the given specification
 *
 * @param {object} aSpec
 *        Information of the UI elements which should be retrieved
 * @param {object} [aSpec.parent=window.document]
 *        Parent of the element to find
 * @param {string} aSpec.type
 *        General type information
 *
 * @returns {Object[]} Array of elements which have been found
 */
AboutNewtabPage.prototype.getElements = function ANTP_getElements(aSpec) {
  var spec = aSpec || { };
  var root = spec.parent ? spec.parent.getNode()
                         : this.contentWindow.document;

  var nodeCollector = new domUtils.nodeCollector(root);

  switch (spec.type) {
    case "grid":
      return [findElement.ID(root, "newtab-grid")];
    case "introPanel":
      return [findElement.ID(root, "newtab-intro-panel")];
    case "introPanel_LearnMore":
      return [findElement.Selector(root, "#newtab-intro-panel > p:first-of-type a")];
    case "introPanel_PrivacyNotice":
      return [findElement.Selector(root, "#newtab-intro-panel > p:nth-of-type(2) a")];
    case "whatIsThisPage":
      return [findElement.ID(root, "newtab-intro-what")];
    default:
      assert.fail("Unknown element type - " + spec.type);
  }
};

// Export of classes
exports.AboutNewtabPage = AboutNewtabPage;
