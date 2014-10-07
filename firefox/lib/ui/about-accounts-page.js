/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var baseInContentPage = require("base-in-content-page");

/**
 * 'About Accounts' in content page class
 * @constructor
 *
 * @param {object} aBrowserWindow
 *        Browser window where the page lives
 */
function AboutAccountsPage(aBrowserWindow) {
  assert.ok(aBrowserWindow, "Browser window has been specified");

  this._browserWindow = aBrowserWindow;
  this._remoteFrameWindow = null;
}

AboutAccountsPage.prototype = Object.create(baseInContentPage.BaseInContentPage.prototype);
AboutAccountsPage.prototype.constructor = AboutAccountsPage;

AboutAccountsPage.prototype.__defineGetter__('remoteFrameWindow', function () {
  if (!this._remoteFrameWindow) {
    this._remoteFrameWindow = this.getElement({type: "remoteFrame"})
                              .getNode().contentWindow;
  }

  return this._remoteFrameWindow;
});

/**
 * Open the about accounts in-content page
 *
 * @params {function} aCallback
 *         Callback that opens the page
 */
AboutAccountsPage.prototype.open = function AboutAccountsPage_open(aCallback) {
  baseInContentPage.BaseInContentPage.prototype.open.call(this, aCallback);

  // Wait for remote frame to load too.
  this.browserWindow.controller.waitForPageLoad(this.remoteFrameWindow.document);
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
AboutAccountsPage.prototype.getElements = function (aSpec) {
  var spec = aSpec || { };
  var root = spec.parent ? spec.parent.getNode()
                         : this.contentWindow.document;

  switch (spec.type) {
    case "getStartedButton":
      return [findElement.ID(root, "buttonGetStarted")];
    case "inputEmail":
      return [findElement.Selector(this.remoteFrameWindow.document, ".email")];
    case "inputPassword":
      return [findElement.ID(this.remoteFrameWindow.document, "password")];
    case "inputSync":
      return [findElement.ID(this.remoteFrameWindow.document, "customize-sync")];
    case "manageButton":
      return [findElement.ID(root, "buttonOpenPrefs")];
    case "remoteFrame":
      return [findElement.ID(root, "remote")];
    case "resetPassword":
      return [findElement.Selector(this.remoteFrameWindow.document, "a.reset-password")];
    case "selectYear":
      return [findElement.ID(this.remoteFrameWindow.document, "fxa-age-year")];
    case "signIn":
      return [findElement.Selector(this.remoteFrameWindow.document, "a.sign-in")];
    case "signUp":
      return [findElement.Selector(this.remoteFrameWindow.document, "a.sign-up")];
    case "submit":
      return [findElement.ID(this.remoteFrameWindow.document, "submit-btn")];
    default:
      assert.fail("Unknown element type - " + spec.type);
  }
};

// Export of classes
exports.AboutAccountsPage = AboutAccountsPage;
