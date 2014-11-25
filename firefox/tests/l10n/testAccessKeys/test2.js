/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include the required modules
var domUtils = require("../../../../lib/dom-utils");
var localization = require("../../../../lib/localization");
var prefs = require("../../../../lib/prefs");
var utils = require("../../../../lib/utils");

const TEST_DATA = "http://www.mozqa.com/data/firefox/layout/html_elements.html";

const GET_BY_ID = domUtils.DOMWalker.GET_BY_ID;
const WINDOW_CURRENT = domUtils.DOMWalker.WINDOW_CURRENT;

const PREF_MISSING_FLASH = "plugins.notifyMissingFlash";

const DEFAULT_HTML_ELEMENT = {
  getBy : GET_BY_ID,
  target : WINDOW_CURRENT,
  preHook : openContextMenu,
  postHook : closeContextMenu
};

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.contextMenu = aModule.controller.getMenu("#contentAreaContextMenu");
  prefs.setPref(PREF_MISSING_FLASH, false);
}

function teardownModule(aModule) {
  prefs.clearUserPref(PREF_MISSING_FLASH);
}

/**
 * Tests the content area context menu for duplicated access keys.
 */
function testContextMenuAccessKeys() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var ids = [
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-canvas" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-input" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-image" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-image-link" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-link" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-mailto" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-video-good" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-audio-in-video" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-video-wrong-source" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-video-wrong-type" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-video-in-iframe" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-image-in-iframe" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, { id : "test-plugin" }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, {
      id : "test-object",
      preHook : openAdobeFlashContextMenu
    }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, {
      id : "test-textarea",
      preHook : selectTextAndOpenContextMenu
    }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, {
      id : "test-input-spellcheck",
      preHook : selectTextAndOpenContextMenu
    }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, {
      id : "test-select-input-text",
      preHook : selectTextAndOpenContextMenu
    }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, {
      id : "test-select-input-text-type-password",
      preHook : selectTextAndOpenContextMenu
    }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, {
      id : "test-text",
      preHook : selectTextAndOpenContextMenu
    }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, {
      id : "test-contenteditable",
      preHook : selectTextAndOpenContextMenu
    }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, {
      id : "test-iframe",
      preHook : selectTextAndOpenContextMenu
    }),
    utils.combineObjects(DEFAULT_HTML_ELEMENT, {
      id : "test-select-text-link",
      preHook : selectTextAndOpenContextMenu
    })
  ];
  var domWalker = new domUtils.DOMWalker(controller,
                                         localization.filterAccessKeys,
                                         localization.prepareAccessKey,
                                         localization.checkAccessKeysResults,
                                         false);
  domWalker.walk(ids);
}

// All functions below will be called from DOMWalker, which does that
// with function.call(nodeElement) so "this" is the currently processed DOM node
function closeContextMenu() {
  contextMenu.close();
}

function openAdobeFlashContextMenu() {
  //  Shockwave Flash - doesn't open a contentAreaContextMenu
  var element = findElement.Elem(this);
  this.focus();
  element.rightClick();
}

function openContextMenu() {
  var element = findElement.Elem(this);
  contextMenu.open(element);
}

function selectTextAndOpenContextMenu() {
  var element = findElement.Elem(this);
  element.doubleClick();
  openContextMenu.call(this);
}