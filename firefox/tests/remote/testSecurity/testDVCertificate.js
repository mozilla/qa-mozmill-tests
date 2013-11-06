/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var utils = require("../../../lib/utils");

const TEST_DATA = "https://ssl-dv.mozqa.com";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.cert = null;
}

/**
 * Test the Larry displays as BLUE
 */
var testLarryBlue = function() {
  // Go to a "blue" website
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the information from the certificate
  var securityUI = controller.window.getBrowser().mCurrentBrowser.securityUI;
  cert = securityUI.QueryInterface(Ci.nsISSLStatusProvider).SSLStatus.serverCert;

  // Check the favicon
  var favicon = new elementslib.ID(controller.window.document, "page-proxy-favicon");
  expect.ok(!favicon.getNode().hasAttribute("hidden"),
            "Lock icon is visible in identity box");

  var faviconImage = utils.getElementStyle(favicon, 'list-style-image');
  expect.contain(faviconImage, "identity-icons-https.png", "There is a lock icon");

  var identityBox = new elementslib.ID(controller.window.document, "identity-box");
  expect.equal(identityBox.getNode().className, "verifiedDomain", "Identity is verified");

  // Click the identity button to display Larry
  controller.click(identityBox);

  // Make sure the doorhanger is "open" before continuing
  var doorhanger = new elementslib.ID(controller.window.document, "identity-popup");
  assert.waitFor(function () {
    return doorhanger.getNode().state === 'open';
  }, "Identity popup has been opened");

  expect.equal(doorhanger.getNode().className, "verifiedDomain",
               "The Larry UI is domain verified (aka Blue)");

  // Check for the Lock icon is visible
  var lockIcon = new elementslib.ID(controller.window.document, "identity-popup-encryption-icon");
  var cssInfoLockImage = utils.getElementStyle(lockIcon, 'list-style-image');

  expect.notEqual(cssInfoLockImage, "none", "There is a lock icon");

  // Bug 443116
  // Larry strips the 'www.' from the CName using the eTLDService
  // This is expected behaviour for the time being
  var host = new elementslib.ID(controller.window.document, "identity-popup-content-host");
  expect.equal(host.getNode().textContent, Services.eTLD.getBaseDomainFromHost(cert.commonName),
               "The site identifier string is equal to the cert host");

  var owner = new elementslib.ID(controller.window.document, "identity-popup-content-owner");
  var property = utils.getProperty("chrome://browser/locale/browser.properties",
                                   "identity.ownerUnknown2");
  expect.equal(owner.getNode().textContent, property, "The owner identifier string is set");

  var l10nVerifierLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                            "identity.identified.verifier");
  l10nVerifierLabel = l10nVerifierLabel.replace("%S", cert.issuerOrganization);
  var verifier = new elementslib.ID(controller.window.document, "identity-popup-content-verifier");
  expect.equal(verifier.getNode().textContent, l10nVerifierLabel,
               "The 'Verified by: %S' string is set");

  var l10nEncryptionLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                              "identity.encrypted2");
  var encryptionLabel = new elementslib.ID(controller.window.document, "identity-popup-encryption-label");
  expect.equal(encryptionLabel.getNode().textContent, l10nEncryptionLabel,
               "The Encryption Label text is set");

  // Check the More Information button
  var moreInfoButton = new elementslib.ID(controller.window.document, "identity-popup-more-info-button");
  controller.click(moreInfoButton);

  utils.handleWindow("type", "Browser:page-info", checkSecurityTab);
}

/**
 * Check the security tab of the page info window
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function checkSecurityTab(controller) {
  var securityTab = new elementslib.ID(controller.window.document, "securityTab");
  assert.ok(securityTab.getNode().selected, "The Security tab is selected by default");

  // Check the Web Site label against the Cert CName
  var webIDDomainLabel = new elementslib.ID(controller.window.document,
                                            "security-identity-domain-value");
  var certName = (cert.commonName.replace(/\./g, "\\\.")).replace(/\*/g, ".*");
  var certNameRegExp = new RegExp("^" + certName + "$");

  expect.match(webIDDomainLabel.getNode().value, certNameRegExp,
               "Expected web site label found");

  // Check the Owner label for "This web site does not supply ownership information."
  var webIDOwnerLabel = new elementslib.ID(controller.window.document,
                                           "security-identity-owner-value");
  var securityOwner = utils.getProperty("chrome://browser/locale/pageInfo.properties",
                                        "securityNoOwner");
  expect.equal(webIDOwnerLabel.getNode().value, securityOwner,
               "Expected owner label found");

  // Check the Verifier label against the Cert Issuer
  var webIDVerifierLabel = new elementslib.ID(controller.window.document,
                                              "security-identity-verifier-value");
  expect.equal(webIDVerifierLabel.getNode().value, cert.issuerOrganization,
               "Expected verifier label found");

  controller.keypress(null, 'VK_ESCAPE', {});
}
