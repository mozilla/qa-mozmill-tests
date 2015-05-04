/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/**
 * @fileoverview Shared module for Selenium IDE
 * @supported Firefox 3.5 and above, Selenium IDE 1.0.10 and above
 */

// Include required modules
var { assert, expect } = require("../../../../../lib/assertions");
var DOMUtils = require("../../../../../lib/dom-utils");
var Utils = require("../../../../../lib/utils");
var Widgets = require("../../../../../lib/ui/widgets");
var windows = require("../../../../../lib/windows");

/**
 * @constructor
 */
function SeleniumManager() {
  this._controller = null;
}

/**
 * @class
 */
SeleniumManager.prototype = {

  /**
   * Get the controller of the Selenium IDE window
   *
   * @returns {MozMillController} Mozmill Controller
   */
  get controller() {
    return this._controller;
  },

  /**
   * Open Selenium IDE
   *
   * @param {MozMillController} aBrowserController Mozmill controller of the browser window
   * @param {String} [aEventType="menu"] Type of event which triggers the action
   *   <dl>
   *     <dt>menu</dt>
   *     <dd>The main menu is used</dd>
   *     <dt>shortcut</dt>
   *     <dd>The keyboard shortcut is used</dd>
   *   </dl>
   */
  open : function SeleniumManager_open(aBrowserController, aEventType) {
    var type = aEventType || "menu";

    switch (type) {
      case "menu":
        aBrowserController.mainMenu.click("#menuToolsSeleniumIDE");
        break;
      case "shortcut":
        aBrowserController.keypress(null, "S", {ctrlKey: true, altKey: true});
        break;
      default:
        assert.fail("Unknown event type - " + event.type);
    }

    this._controller = windows.handleWindow("type", "global:selenium-ide", undefined, false);
  },

  /**
   * Close Selenium IDE
   */
  close : function SeleniumManager_close() {
    this._controller.window.close();
    this.waitForClosed();
  },

  /**
   * Wait for the Selenium IDE window to be closed
   */
  waitForClosed : function SeleniumManager_waitForClosed() {
    assert.waitFor(function () {
      return !mozmill.utils.getWindowByType("global:selenium-ide");
    }, "Selenium IDE has been closed.");
    this._controller = null;
  },

  /**
   * Clear the base URL field
   */
  clearBaseURLField : function addonsManager_clearBaseURLField() {
    var baseURL = this.getElement({type: "baseURL"});
    var cmdKey = Utils.getEntity(this.getDtds(), "selectAllCmd.key");
    this._controller.keypress(baseURL, cmdKey, {accelKey: true});
    this._controller.keypress(baseURL, 'VK_DELETE', {});
  },

  /**
   * Set the value of the base URL
   *
   * @param {String} aUrl New base URL value
   */
  set baseURL(aUrl) {
    this.clearBaseURLField();
    var baseURL = this.getElement({type: "baseURL"});
    this._controller.type(baseURL, aUrl);
  },

  /**
   * Add a test command
   *
   * @param {Object} aSpec Information of the test command to be added
   * @param {String} aSpec.action Command name
   * @param {String} aSpec.target Element locator
   * @param {String} aSpec.value Value
   */
  addCommand : function SeleniumManager_addCommand(aSpec) {
    var commands = this.getElement({type: "commands"});
    Widgets.clickTreeCell(this._controller, commands, commands.getNode().view.rowCount - 1, 0, {});

    if (aSpec.action !== undefined) {
      var command = this.getElement({type: "command_action"});
      // Clear possible left-over values
      command.getNode().value = "";
      this._controller.type(command, aSpec.action);
    }

    if (aSpec.target !== undefined) {
      var target = this.getElement({type: "command_target"});
      // Clear possible left-over values
      target.getNode().value = "";
      this._controller.type(target, aSpec.target);
    }

    if (aSpec.value !== undefined) {
      var value = this.getElement({type: "command_value"});
      // Clear possible left-over values
      value.getNode().value = "";
      this._controller.type(value, aSpec.value);
    }
  },

  /**
   * Play a test case
   */
  playTest : function SeleniumManager_playTest() {
    var playTest = this.getElement({type: "button_playTest"});
    this._controller.click(playTest);

    //wait until play button is enabled
    assert.waitFor(function () {
      return !playTest.getNode().disabled;
    }, "Play test button is enabled");
  },

  /**
   * Check that the suite has passed according to the progress indicator
   *
   * @returns {Boolean} Returns true if the progress indicator has the necessary style
   * to make it appear green
   */
  get isSuiteProgressIndicatorGreen() {
    var suiteProgressIndicator = this.getElement({type: "suiteProgress_indicator"});
    return (suiteProgressIndicator.getNode().className === "success");
  },

  /**
   * Check that the suite has failed according to the progress indicator
   *
   * @returns {Boolean} Returns true if the progress indicator has the necessary style
   * to make it appear red
   */
  get isSuiteProgressIndicatorRed() {
    var suiteProgressIndicator = this.getElement({type: "suiteProgress_indicator"});
    return (suiteProgressIndicator.getNode().className === "failure");
  },

  /**
   * Retrieve the test run count
   *
   * @returns {ElemBase} Element which represents the test run count
   */
  get runCount() {
    return this.getElement({type: "suiteProgress_runCount"});
  },

  /**
   * Retrieve the test failure count
   *
   * @returns {ElemBase} Element which represents the test failure count
   */
  get failureCount() {
    return this.getElement({type: "suiteProgress_failureCount"});
  },

  /**
   * Retrieve the info from the log
   *
   * @returns {ElemBase[]} Log info
   */
  get logInfo() {
    return this.getElements({type: "log_info"});
  },

  /**
   * Retrieve the final info message from the log that starts with echo
   *
   * @returns {String} Log info message
   */
  get finalLogEchoInfoMessage() {
    var logInfo = this.logInfo;
    var index = logInfo.length;
    while (--index >= 0) {
      var message = this.getLogInfoMessage(index);
      if (message.substr(0,5) == 'echo:') {
        return message;
      }
    }
    return null;
  },

  /**
   * Retrieve the final info message from the log
   *
   * @returns {String} Log info message
   */
  get finalLogInfoMessage() {
    return this.getLogInfoMessage(-1);
  },

  /**
   * Retrieve the errors from the log
   *
   * @returns {ElemBase[]} Log errors
   */
  get logErrors() {
    return this.getElements({type: "log_errors"});
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns {String[]} Array of external DTD urls
   */
  getDtds : function searchBar_getDtds() {
    var dtds = ["chrome://browser/locale/browser.dtd"];
    return dtds;
  },

  /**
   * Retrieve a info message from the log
   *
   * @param {Integer} aOffset Index if positive or offset from the last element
   *                  if negative where -1 is last
   * @returns {String} Log info message
   */
  getLogInfoMessage : function SeleniumManager_getLogInfoMessage(aOffset) {
    var logInfo = this.logInfo;
    var index = aOffset;
    if (aOffset < 0) {
      index += logInfo.length;
    }
    if (index < 0 || index >= logInfo.length) {
      return 'Bad aOffset';
    }
    var message = logInfo[index].getNode().textContent;
    var re = new RegExp("^\\[info] (.*)");
    return re.exec(message)[1];
  },

  ///////////////////////////////
  // UI Elements section
  ///////////////////////////////

  /**
   * Retrieve a UI element based on the given specification
   *
   * @param {Object} aSpec Information of the UI elements which should be retrieved
   * @param {String} aSpec.type Identifier of the element
   * @param {String} aSpec.subtype Attribute of the element to filter [optional - default: ""]
   * @param {String} aSpec.value Value of the attribute to filter [optional - default: ""]
   * @param {Object} aSpec.parent Parent of the to find element [optional - default: document]
   *
   * @returns {ElemBase} Element which has been found
   */
  getElement : function SeleniumManager_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {Object} aSpec Information of the UI elements which should be retrieved
   * @param {String} aSpec.type Identifier of the element
   * @param {String} aSpec.subtype Attribute of the element to filter [optional - default: ""]
   * @param {String} aSpec.value Value of the attribute to filter [optional - default: ""]
   * @param {Object} aSpec.parent Parent of the to find element [optional - default: document]
   *
   * @returns {ElemBase[]} Elements which have been found
   */
  getElements : function SeleniumManager_getElements(aSpec) {
    var spec = aSpec || { };
    var type = spec.type;
    var subtype = spec.subtype;
    var value = spec.value;
    var parent = spec.parent;

    var root = parent ? parent.getNode() : this._controller.window.document;
    var nodeCollector = new DOMUtils.nodeCollector(root);

    switch (type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
      case "baseURL":
        nodeCollector.queryNodes("#baseURL");
        break;
      case "button_playTest":
        nodeCollector.queryNodes("#play-button");
        break;
      case "commands":
        nodeCollector.queryNodes("#commands");
        break;
      case "command_action":
        nodeCollector.queryNodes("#commandAction");
        break;
      case "command_target":
        nodeCollector.queryNodes("#commandTarget");
        break;
      case "command_value":
        nodeCollector.queryNodes("#commandValue");
        break;
      case "suiteProgress_indicator":
        nodeCollector.queryNodes("#suiteProgressIndicator");
        break;
      case "suiteProgress_runCount":
        nodeCollector.queryNodes("#suiteProgressRuns");
        break;
      case "suiteProgress_failureCount":
        nodeCollector.queryNodes("#suiteProgressFailures");
        break;
      case "log_info":
        nodeCollector.queryNodes("#logView");
        nodeCollector.root = nodeCollector.nodes[0].contentDocument;
        nodeCollector.queryNodes(".info");
        break;
      case "log_errors":
        nodeCollector.queryNodes("#logView");
        nodeCollector.root = nodeCollector.nodes[0].contentDocument;
        nodeCollector.queryNodes(".error");
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return nodeCollector.elements;
  }

};

// Export classes
exports.SeleniumManager = SeleniumManager;
