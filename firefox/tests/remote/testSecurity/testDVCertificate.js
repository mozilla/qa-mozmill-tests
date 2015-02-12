/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var security = require("../../../lib/security");
var utils = require("../../../../lib/utils");
var windows = require("../../../../lib/windows");

var browser = require("../../../lib/ui/browser");

const TEST_DATA = "https://ssl-dv.mozqa.com";

function setupModule(aModule) {
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
 * Test the Larry displays as BLUE
 */
function testLarryBlue() {
  // Go to a "blue" website
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the information from the certificate
  cert = security.getCertificate(browserWindow.tabs.securityUI);

  // Check the favicon
  var favicon = locationBar.getElement({type: "favicon"});
  expect.ok(!favicon.getNode().hasAttribute("hidden"),
            "Lock icon is visible in identity box");

  var faviconImage = utils.getElementStyle(favicon, "list-style-image");
  expect.contain(faviconImage, "identity-icons-https", "There is a lock icon");

  var identityBox = identityPopup.getElement({type: "box"});
  expect.equal(identityBox.getNode().className, "verifiedDomain",
               "Identity is verified");

  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    identityBox.click();
  }, {type: "identity"});

  var doorhanger = identityPopup.getElement({type: "popup"});

  expect.equal(doorhanger.getNode().className, "verifiedDomain",
               "The Larry UI is domain verified (aka Blue)");

  // Check for the Lock icon is visible
  var lockIcon = identityPopup.getElement({type: "encryptionIcon"});
  var cssInfoLockImage = utils.getElementStyle(lockIcon, "list-style-image");

  expect.notEqual(cssInfoLockImage, "none", "There is a lock icon");

  // Bug 443116
  // Larry strips the 'www.' from the CName using the eTLDService
  // This is expected behaviour for the time being
  var host = identityPopup.getElement({type: "host"});
  expect.equal(host.getNode().textContent,
               Services.eTLD.getBaseDomainFromHost(cert.commonName),
               "The site identifier string is equal to the cert host");

  var l10nVerifierLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                            "identity.identified.verifier");
  l10nVerifierLabel = l10nVerifierLabel.replace("%S", cert.issuerOrganization);
  var verifier = identityPopup.getElement({type: "verifier"});
  expect.equal(verifier.getNode().textContent, l10nVerifierLabel,
               "The 'Verified by: %S' string is set");

  var l10nEncryptionLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                              "identity.encrypted2");
  var encryptionLabel = identityPopup.getElement({type: "encryptionLabel"});
  expect.equal(encryptionLabel.getNode().textContent, l10nEncryptionLabel,
               "The Encryption Label text is set");

  // Check the More Information button
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
  var securityTab = new elementslib.ID(aController.window.document, "securityTab");
  assert.ok(securityTab.getNode().selected, "The Security tab is selected by default");

  // Check the Web Site label against the Cert CName
  var webIDDomainLabel = new elementslib.ID(aController.window.document,
                                            "security-identity-domain-value");
  var certName = (cert.commonName.replace(/\./g, "\\\.")).replace(/\*/g, ".*");
  var certNameRegExp = new RegExp("^" + certName + "$");

  expect.match(webIDDomainLabel.getNode().value, certNameRegExp,
               "Expected web site label found");

  // Check the Owner label for "This web site does not supply ownership information."
  var webIDOwnerLabel = new elementslib.ID(aController.window.document,
                                           "security-identity-owner-value");
  var securityOwner = utils.getProperty("chrome://browser/locale/pageInfo.properties",
                                        "securityNoOwner");
  expect.equal(webIDOwnerLabel.getNode().value, securityOwner,
               "Expected owner label found");

  // Check the Verifier label against the Cert Issuer
  var webIDVerifierLabel = new elementslib.ID(aController.window.document,
                                              "security-identity-verifier-value");
  expect.equal(webIDVerifierLabel.getNode().value, cert.issuerOrganization,
               "Expected verifier label found");

  aController.keypress(null, 'VK_ESCAPE', {});
}
