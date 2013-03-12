/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const G_TIMEOUT = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

var testNavigateFTP = function () {
  // opens the mozilla.org ftp page then navigates through a couple levels.
  controller.open('ftp://ftp.mozilla.org/pub/');
  controller.waitForPageLoad();

  var firefox = new elementslib.Link(controller.tabs.activeTab, 'firefox');
  controller.waitThenClick(firefox, G_TIMEOUT);
  controller.waitForPageLoad();

  var nightly = new elementslib.Link(controller.tabs.activeTab, 'nightly');
  controller.waitThenClick(nightly, G_TIMEOUT);
  controller.waitForPageLoad();

  var latestLink = new elementslib.Link(controller.tabs.activeTab, 'latest-trunk');
  controller.waitForElement(latestLink, G_TIMEOUT);
}

/**
 * Map test functions to litmus tests
 */
// testNavigateFTP.meta = {litmusids : [7962]};
