/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var windows = require("../windows");

var dialogs = require("../ui/dialogs");
var browser = require("../../firefox/lib/ui/browser");

const TEST_ELEMENTS = {
  button_accept: "button",
  button_cancel: "button",
  button_disclosure: "button",
  button_extra1: "button",
  button_extra2: "button",
  button_help: "button",
  checkbox: "checkbox",
  info_body: "description",
  info_icon: "image",
  info_title: "description",
  login_label: "label",
  login_textbox: "textbox",
  password_label: "label",
  password_textbox: "textbox"
};

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
}

function teardownModule(aModule) {
  windows.closeAllWindows(aModule.browserWindow);
}

function testCommonDialog() {
  var dialog = dialogs.open(() => {
    controller.window.openDialog("chrome://global/content/commonDialog.xul",
                                 "Basic Common Dialog","");
  });

  for (var element in TEST_ELEMENTS) {
    var el = dialog.getElement({type: element});
    expect.equal(el.getNode().localName, TEST_ELEMENTS[element],
                 "Element " + element + " has been found.");
  };

  dialog.close();
}
