/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var security = require("../../../lib/security");
var windows = require("../../../../lib/windows");

var browser = require("../../../lib/ui/browser");

const TEST_DATA = "https://ssl-ev.mozqa.com/";

var setupModule = function(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;
  aModule.identityPopup = aModule.locationBar.identityPopup;

  aModule.targetPanel = null;
  aModule.cert = null;
}

function teardownModule(aModule) {
  if (aModule.targetPanel) {
    aModule.targetPanel.getNode().hidePopup();
  }
}

/**
 * Test clicking the 'More Information' button in Larry,
 * to open the Page Info dialog to the Security tab
 */
function testSecurityInfoViaMoreInformation() {
  // Go to a secure website
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the information from the certificate for comparison
  cert = security.getCertificate(browserWindow.tabs.securityUI);

  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    var identityBox = identityPopup.getElement({type: "box"});
    identityBox.click();
  }, {type: "identity"});

  // Click the 'More Information' button in the Larry popup notification
  var moreInfoButton = identityPopup.getElement({type: "moreInfoButton"});
  moreInfoButton.click();

  windows.handleWindow("type", "Browser:page-info", checkSecurityTab);
}

/**
 * Check the security tab of the page info window
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function checkSecurityTab(aController) {
  // Check that the Security tab is selected by default
  var securityTab = new elementslib.ID(aController.window.document, "securityTab");
  expect.ok(securityTab.getNode().selected, "Security tab is selected");

  // Check the Web Site label against the Cert CName
  var webIDDomainLabel = new elementslib.ID(aController.window.document,
                                            "security-identity-domain-value");
  expect.equal(webIDDomainLabel.getNode().value, cert.commonName,
               "Domain found in Cerificate Common Name");

  // Check the Owner label against the Cert Owner
  var webIDOwnerLabel = new elementslib.ID(aController.window.document,
                                           "security-identity-owner-value");
  expect.equal(webIDOwnerLabel.getNode().value, cert.organization,
               "Certificate Owner matches Website Owner");

  // Check the Verifier label against the Cert Issuer
  var webIDVerifierLabel = new elementslib.ID(aController.window.document,
                                              "security-identity-verifier-value");
  expect.equal(webIDVerifierLabel.getNode().value, cert.issuerOrganization,
               "Certificate Verifier matches Website Verifier");

  // Close the Page Info window by pressing Escape
  aController.keypress(null, 'VK_ESCAPE', {});
}
