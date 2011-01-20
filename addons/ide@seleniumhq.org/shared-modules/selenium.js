/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 *
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Dave Hunt <dhunt@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * @fileoverview Shared module for Selenium IDE
 * @supported Firefox 3.5 and above, Selenium IDE 1.0.10 and above
 *
 * @author dhunt@mozilla.com (Dave Hunt)
 */

// Include required modules
var DOMUtils = require("../../../shared-modules/dom-utils");
var Utils = require("../../../shared-modules/utils");
var Widgets = require("../../../shared-modules/widgets");

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
   * @returns Mozmill Controller
   * @type {MozMillController}
   */
  get controller() {
    return this._controller;
  },

  /**
   * Open Selenium IDE
   *
   * @param {MozMillController} browserController
   *        Mozmill controller of the browser window
   */
  open : function SeleniumManager_open(browserController) {
    browserController.mainMenu.click("#menu_ToolsPopupItem");
    this._controller = Utils.handleWindow("type", "global:selenium-ide", undefined, false);
  },

  /**
   * Set the value of the base URL
   *
   * @param {String} url
   *        New base URL value
   */
  set baseURL(url) {
    var baseURL = this.getElement({type: "baseURL"});
    this._controller.type(baseURL, url);
  },

  /**
   * Add a test command
   *
   * @param {object} spec
   *        Information of the test command to be added
   *        action: Command name
   *        target: Element locator
   *        value: Value
   */
  addCommand : function SeleniumManager_addCommand(spec) {
    var commands = this.getElement({type: "commands"});
    Widgets.clickTreeCell(this._controller, commands, commands.getNode().view.rowCount - 1, 0, {});

    if (spec.action !== undefined) {
      var command = this.getElement({type: "command_action"});
      this._controller.type(command, spec.action);
    }

    if (spec.target !== undefined) {
      var target = this.getElement({type: "command_target"});
      this._controller.type(target, spec.target);
    }

    if (spec.value !== undefined) {
      var value = this.getElement({type: "command_value"});
      this._controller.type(value, spec.value);
    }
  },

  /**
   * Play a test case
   */
  playTest : function SeleniumManager_playTest() {
    var playTest = this.getElement({type: "button_playTest"});
    this._controller.click(playTest);

    //wait until play button is enabled
    this._controller.waitFor(function () {
      return !playTest.getNode().disabled;
    }, "Play test button is enabled");
  },

  /**
   * Check that the suite has passed according to the progress indicator
   *
   * @returns Returns true if the progress indicator has the necessary style
   * to make it appear green
   * @type {boolean}
   */
  get isSuiteProgressIndicatorGreen() {
    var suiteProgressIndicator = this.getElement({type: "suiteProgress_indicator"});
    return (suiteProgressIndicator.getNode().className === "success");
  },

  /**
   * Retrieve the test run count
   *
   * @returns Element which represents the test run count
   * @type {ElemBase}
   */
  get runCount() {
    return this.getElement({type: "suiteProgress_runCount"});
  },

  /**
   * Retrieve the test failure count
   *
   * @returns Element which represents the test failure count
   * @type {ElemBase}
   */
  get failureCount() {
    return this.getElement({type: "suiteProgress_failureCount"});
  },

  /**
   * Retrieve the log content
   *
   * @returns Log content
   * @type [string]
   */
  get logConsole() {
    return this.getElement({type: "logConsole"});
  },


  ///////////////////////////////
  // UI Elements section
  ///////////////////////////////

  /**
   * Retrieve a UI element based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   *        Elements: type     - Identifier of the element
   *                  subtype  - Attribute of the element to filter
   *                             [optional - default: ""]
   *                  value    - Value of the attribute to filter
   *                             [optional - default: ""]
   *                  parent   - Parent of the to find element
   *                             [optional - default: document]
   *
   * @returns Element which has been found
   * @type {ElemBase}
   */
  getElement : function SeleniumManager_getElement(aSpec) {
    var elements = this.getElements(aSpec);

    return (elements.length > 0) ? elements[0] : undefined;
  },

  /**
   * Retrieve list of UI elements based on the given specification
   *
   * @param {object} aSpec
   *        Information of the UI elements which should be retrieved
   *        Elements: type     - Identifier of the element
   *                  subtype  - Attribute of the element to filter
   *                             [optional - default: ""]
   *                  value    - Value of the attribute to filter
   *                             [optional - default: ""]
   *                  parent   - Parent of the to find element
   *                             [optional - default: document]
   *
   * @returns Elements which have been found
   * @type {array of ElemBase}
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
      case "logConsole":
        nodeCollector.queryNodes("#logView");
        nodeCollector.root = nodeCollector.nodes[0].contentDocument;
        nodeCollector.queryNodes("#logging-console");
        break;
      default:
        throw new Error(arguments.callee.name + ": Unknown element type - " + spec.type);
    }

    return nodeCollector.elements;
  }

};

// Export classes
exports.SeleniumManager = SeleniumManager;
