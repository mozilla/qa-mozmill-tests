/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

const TEST_DATA = "ftp://ftp.mozqa.com/";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

var testNavigateFTP = function () {
  // opens the mozilla.org ftp page then navigates through a couple levels.
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var dataLink = new elementslib.Link(controller.tabs.activeTab, 'data');
  controller.click(dataLink);
  controller.waitForPageLoad();

  var up = new elementslib.Selector(controller.tabs.activeTab, '.up');
  controller.click(up);
  controller.waitForPageLoad();

  controller.waitForElement(dataLink);
}


