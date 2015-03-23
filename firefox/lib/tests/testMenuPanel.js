/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include required modules
var browser = require("../ui/browser");

const MENU_PANEL_ELEMENTS = {
  openButton: "toolbarbutton",
  panel: "panel",
  panel_addons: "toolbarbutton",
  panel_fxaStatus: "toolbarbutton",
  panel_newWindow: "toolbarbutton",
  panel_preferences: "toolbarbutton",
  panel_quitFirefox: "toolbarbutton"
};

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.menuPanel = aModule.browserWindow.navBar.menuPanel;
}

function teardownModule(aModule) {
  aModule.menuPanel.close({force: true});
}

/**
 * Bug 1079710
 * Test that the elements in library are present on the Menu Panel
 */
function testMenuPanel() {
  menuPanel.open();
  expect.ok(menuPanel.isOpen, "Menu panel is open");

  for (var element in MENU_PANEL_ELEMENTS) {
    var el = menuPanel.getElement({type: element});
    assert.equal(el.getNode().localName, MENU_PANEL_ELEMENTS[element],
                 "Element has been found - " + element);
  }

  // Open about:accounts page from menu panel
  var fxaStatus = menuPanel.getElement({type: "panel_fxaStatus"});
  var aboutAccountsPage = browserWindow.openAboutAccountsPage(
    {type: "callback", callback: () => { fxaStatus.click(); }}
  );
  aboutAccountsPage.close();

  // Open about:preferences page from menu panel
  var preferencesButton = menuPanel.getElement({type: "panel_preferences"});
  var aboutPreferencesPage = browserWindow.openAboutPreferencesPage(
    {type: "callback", callback: () => { preferencesButton.click(); }}
  );
  aboutPreferencesPage.close();

  menuPanel.close();
}
