/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

var { assert } = require("../../../lib/assertions");
var utils = require("../../../firefox/lib/utils");

const PANELS = {
  about: {shortcut: "aboutFlyout.key"},
  options: {shortcut: "optionsFlyout.key"},
  search: {shortcut: null}
};

/**
 * FlyoutPanel class
 *
 * @constructor
 * @param {MozMillController} aController
 *        MozMill controller of the window to operate in
 */
function FlyoutPanel(aController) {
  assert.ok(aController, "A valid controller must be specified");

  this._controller = aController;
}

FlyoutPanel.prototype = {
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
   * Close a panel
   *
   * @param {String} aPanel="about"|"options"|"search"
   *        The name of the panel to be closed
   * @param {Object} [aSpec]
   *        Information for this operation
   * @param {String} [aSpec.eventType="shortcut"]
   *        The event used for closing the panel
   * @param {Boolean} [aSpec.force=false]
   *        Force closing the flyout panel
   */
  closePanel : function flyoutPanel_closePanel(aPanel, aSpec) {
    var spec = aSpec || {};
    var type = spec.eventType || "shortcut";
    var force = !!spec.force;
    var panel = this.getElement({type: aPanel});

    if (force) {
      panel.getNode().hide();
      return;
    }

    var self = { transitioned: false };
    function checkTransitioned() { self.transitioned = true; }
    panel.getNode().addEventListener("transitionend", checkTransitioned);

    try {
      switch (type) {
        case "shortcut":
          var win = new findElement.MozMillElement("Elem", this._controller.window);
          win.keypress("VK_ESCAPE", {});
          break;
        case "tap":
          var document = new findElement.Elem(this._controller.window.document.
                                              documentElement);
          document.tap();
          break;
        default:
          assert.fail("Unknown event type - " + type);
      }

      assert.waitFor(() => self.transitioned,
                     "Panel '" + aPanel + "' has been closed");
    }
    finally {
      panel.getNode().removeEventListener("transitionend", checkTransitioned);
    }
  },

  /**
   * Close any panel if opened
   *
   * @param {Boolean} [aForce]
   *        Force closing the opened panel
   */
  closeAllPanels : function flyoutPanel_closeAllPanels(aForce) {
    for (var prop in PANELS) {
      var panel = this.getElement({type: prop});
      if (panel.getNode().hasAttribute("isSlidingIn") ||
          panel.getNode().hasAttribute("isSlidIn")) {
        this.closePanel(prop, {force: aForce});
      }
    }
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns {String} - Array of external DTD urls
   */
  getDtds : function flyoutPanel_getDtds() {
    let dtds = ["chrome://browser/locale/browser.dtd"];

    return dtds;
  },

  /**
   * Retrieve an UI element based on the given specification
   *
   * @param {Object} aSpec
   *        Information of the UI element which should be retrieved
   * @param {Object} aSpec.type
   *        Identifier of the element
   * @param {Object} [aSpec.subtype=""]
   *        Attribute of the element to filter
   * @returns {Object} Element which has been found
   */
  getElement : function flyoutPanel_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {Object} aSpec
   *        Information of the UI elements which should be retrieved
   * @param {Object} aSpec.type
   *        General type information
   * @param {Object} [aSpec.subtype]
   *        Specific element or property
   *
   * @returns {Object[]} Array of elements which have been found
   */
  getElements : function flyoutPanel_getElements(aSpec) {
    var spec = aSpec || {};
    var elem = null;

    switch(spec.type) {
      case "about":
        elem = new findElement.ID(this._controller.window.document,
                                  "about-flyoutpanel");
        break;
      case "options":
        elem = new findElement.ID(this._controller.window.document,
                                  "prefs-flyoutpanel")
        break;
      case "search":
        elem = new findElement.ID(this._controller.window.document,
                                  "search-flyoutpanel")
        break;
      default:
        assert.fail("Unknown panel - " + spec.type);
    }

    return [elem];
  },

  /**
   * Open a panel
   *
   * @param {String} aPanel="about"|"options"|"search"
   *        The name of the panel to be opened
   * @param {String} [aEventType="shortcut"]
   *        The event used for opening the panel
   */
  openPanel : function FlyoutPanel_openPanel(aPanel, aEventType) {
    var type = aEventType || "shortcut";
    var panel = this.getElement({type: aPanel});

    var self = { transitioned: false };
    function checkTransitioned() { self.transitioned = true; }
    panel.getNode().addEventListener("transitionend", checkTransitioned);

    try {
      switch (type) {
        case "shortcut":
          assert.ok(PANELS[aPanel].shortcut,
                    "Panel '" + aPanel + "' can be opened with a shortcut");
          let win = new findElement.MozMillElement("Elem", this._controller.window);
          let cmdKey = utils.getEntity(this.getDtds(), PANELS[aPanel].shortcut);

          win.keypress(cmdKey, {accelKey: true, shiftKey: true});
          break;
        default:
          assert.fail("Unknown event type - " + type);
      }

      assert.waitFor(() => self.transitioned,
                     "Panel '" + aPanel + "' has been opened");
    }
    finally {
      panel.getNode().removeEventListener("transitionend", checkTransitioned);
    }
  }
}

exports.FlyoutPanel = FlyoutPanel;
