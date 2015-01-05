/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include required modules
var browser = require("../ui/browser");

const TEST_DATA = {
  url : "https://ssl-dv.mozqa.com",
  elements : [
    {name: "box", type: "box"},
    {name: "countryLabel", type: "label"},
    {name: "organizationLabel", type: "label"},
    {name: "popup", type: "panel"}
  ],
  popup_elements: [
    {name: "moreInfoButton", type: "button"},
    {name: "encryptionLabel", type: "description"},
    {name: "encryptionIcon", type: "image"},
    {name: "host", type: "description"},
    {name: "owner", type: "description"},
    {name: "ownerLocation", type: "description"},
    {name: "permissions", type: "vbox"},
    {name: "verifier", type: "description"}
  ]
};

function setupModule(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;
  aModule.identityPopup = aModule.locationBar.identityPopup;

  aModule.targetPanel = null;
}

function teardownModule(aModule) {
  if (aModule.targetPanel) {
    aModule.targetPanel.getNode().hidePopup();
  }
}

function testIdentity() {
  controller.open(TEST_DATA.url);
  controller.waitForPageLoad();

  TEST_DATA.elements.forEach(aElement => {
    var node = identityPopup.getElement({type: aElement.name}).getNode();

    expect.equal(node.localName, aElement.type,
                 aElement.name + " element has been found");
  });

  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    identityPopup.getElement({type: "box"}).click();
  }, {type: "identity"});

  TEST_DATA.popup_elements.forEach(aElement => {
    var node = identityPopup.getElement({type: aElement.name}).getNode();

    expect.equal(node.localName, aElement.type,
                 aElement.name + " element has been found");
  });

  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    aPanel.keypress("VK_ESCAPE", {});
  }, {type: "identity", open: false});
}
