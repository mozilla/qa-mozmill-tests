/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var browser = require("../ui/browser");

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();

  aModule.browserWindow.tabs.closeAllTabs();
}

function teardownModule(aModule) {
  aModule.browserWindow.tabs.closeAllTabs();
}

function testAboutAccounts() {
  var aboutAccounts = browserWindow.openAboutAccountsPage();
  assert.ok(aboutAccounts.isOpen, "Tab with the in-content page has been opened");

  // Click on "Get started" button
  var getStartedButton = aboutAccounts.getElement({type: "getStartedButton"});
  getStartedButton.waitThenClick();

  // "Sign In" link should be displayed when we clicked on "Get started" button
  var signIn = aboutAccounts.getElement({type: "signIn"});
  signIn.waitThenClick();

  // "Sign Up" link should be displayed when we clicked on "Sign In" link
  var signUp = aboutAccounts.getElement({type: "signUp"});
  signUp.waitThenClick();

  signIn = aboutAccounts.getElement({type: "signIn"});
  signIn.waitThenClick();

  // "Forgot password?" link should be displayed
  var resetPassword = aboutAccounts.getElement({type: "resetPassword"});
  resetPassword.waitThenClick();

  aboutAccounts.close();
  assert.ok(!aboutAccounts.isOpen, "Tab with the in-content page has been closed");
}
