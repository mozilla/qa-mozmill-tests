/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/**
 * Constructor
 *
 * @param {MozMillController} aController
 *        Controller of the window
 */
function Appbar(aController) {
  if (!aController) {
    assert.fail("A valid controller must be specified");
  }

  this._controller = aController;
}

/**
 * Prototype definition of the Appbar class
 */
Appbar.prototype = {
  /**
   * Returns the controller of the class instance
   *
   * @returns {MozMillController} Controller of the window
   */
  get controller() {
    return this._controller;
  },

  /**
   * Retrieve an UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @param {object} type
   *        Identifier of the element
   * @param {object} [subtype=""]
   *        Attribute of the element to filter
   * @param {object} [value=""]
   *        Value of the attribute to filter
   * @param {object} [parent=document]
   *        Parent of the element to find
   *
   * @returns {object} Element which has been found
   */
  getElement : function appbar_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {Object} aSpec
   *        Information of the UI elements which should be retrieved
   * @param {Object} type
   *        General type information
   * @param {Object} subtype
   *        Specific element or property
   * @param {Object} value
   *        Value of the element or property
   *
   * @returns {Object[]} Array of elements which have been found
   */
  getElements : function appbar_getElements(aSpec) {
    var elem = null;

    switch(aSpec.type) {
      case "clearButton":
        elem = new findElement.ID(this._controller.window.document, "clear-selected-button");
        break;
      case "deleteButton":
        elem = new findElement.ID(this._controller.window.document, "delete-selected-button");
        break;
      case "hideButton":
        elem = new findElement.ID(this._controller.window.document, "hide-selected-button");
        break;
      case "itemsAppbar":
        elem = new findElement.ID(this._controller.window.document, "contextappbar");
        break;
      case "itemsActions":
        elem = new findElement.ID(this._controller.window.document, "contextualactions-tray");
        break;
      case "pinToStartButton":
        elem = new findElement.ID(this._controller.window.document, "pin-selected-button");
        break;
      case "restoreButton":
        elem = new findElement.ID(this._controller.window.document, "restore-selected-button");
        break;
      case "unpinButton":
        elem = new findElement.ID(this._controller.window.document, "unpin-selected-button");
        break;
      default:
        throw new Error("Unknown element type - " + aSpec.type);
    }

    return [elem];
  }
};

/**
 * Constructor for the start page which has Top Sites, Bookmarks and History
 *
 * @param {MozMillController} aController
 *        Controller of the window
 */
function StartScreen(aController) {
  if (!aController) {
    assert.fail("A valid controller must be specified");
  }

  this._controller = aController;
  this.appbar = new Appbar(aController);
}

/**
 * Prototype definition of the Metro mode class
 */
StartScreen.prototype = {
  /**
   * Returns the controller of the class instance
   *
   * @returns {MozMillController} Controller of the window
   */
  get controller() {
    return this._controller;
  },

  /**
   * Retrieve an UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   * @param {object} type
   *        Identifier of the element
   * @param {object} [subtype=""]
   *        Attribute of the element to filter
   * @param {object} [value=""]
   *        Value of the attribute to filter
   * @param {object} [parent=document]
   *        Parent of the element to find
   *
   * @returns {object} Element which has been found
   */
  getElement : function screen_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {Object} aSpec
   *        Information of the UI elements which should be retrieved
   * @param {Object} type
   *        General type information
   * @param {Object} subtype
   *        Specific element or property
   * @param {Object} value
   *        Value of the element or property
   *
   * @returns {Object[]} Array of elements which have been found
   */
  getElements : function screen_getElements(aSpec) {
    var elem = null;

    switch(aSpec.type) {
      case "bookmarks":
        elem = new findElement.ID(this._controller.window.document, "start-bookmarks");
        break;
      case "history":
        elem = new findElement.ID(this._controller.window.document, "start-history");
        break;
      case "remoteTabs":
        elem = new findElement.ID(this._controller.window.document, "start-remotetabs");
        break;
      case "startContainer":
        elem = new findElement.ID(this._controller.window.document, "start-container");
        break;
      case "topSites":
        elem = new findElement.ID(this._controller.window.document, "start-topsites");
        break;
      default:
        throw new Error("Unknown element type - " + aSpec.type);
    }

    return [elem];
  }
};

exports.StartScreen = StartScreen;
