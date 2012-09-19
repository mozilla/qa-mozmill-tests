/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var {expect} = require("../../../lib/assertions");
var utils = require("../../../lib/utils");

var setupModule = function(module) {
  controller = mozmill.getBrowserController();

  // Effective TLD Service for grabbing certificate info
  gETLDService = Cc["@mozilla.org/network/effective-tld-service;1"].
                 getService(Ci.nsIEffectiveTLDService);
  cert = null;
}

/**
 * Test the Larry displays as BLUE
 */
var testLarryBlue = function() {
  // Go to a "blue" website
  controller.open("https://ssl-dv.mozqa.com");
  controller.waitForPageLoad();

  // Get the information from the certificate for comparison
  var securityUI = controller.window.getBrowser().mCurrentBrowser.securityUI;
  cert = securityUI.QueryInterface(Ci.nsISSLStatusProvider).SSLStatus.serverCert;

  // Check the label displays
  // Format: Organization
  var identLabel = new elementslib.ID(controller.window.document, "identity-icon-label");
  controller.assertValue(identLabel, gETLDService.getBaseDomainFromHost(cert.commonName));

  // Check the favicon
  var favicon = new elementslib.ID(controller.window.document, "page-proxy-favicon");
  controller.waitFor(function () {
    return favicon.getNode().src.indexOf("mozqa.com") !== -1;
  }, "Favicon is loaded");

  // Check the identity box shows green
  var identityBox = new elementslib.ID(controller.window.document, "identity-box");
  controller.assertJSProperty(identityBox, "className", "verifiedDomain");

  // Click the identity button to display Larry
  controller.click(identityBox);

  // Make sure the doorhanger is "open" before continuing
  var doorhanger = new elementslib.ID(controller.window.document, "identity-popup");
  controller.waitFor(function () {
    return doorhanger.getNode().state === 'open';
  }, "Identity popup has been opened");

  // Check that the Larry UI is domain verified (aka Blue)
  controller.assertJSProperty(doorhanger, "className", "verifiedDomain");

  // Check for the Lock icon is visible
  var lockIcon = new elementslib.ID(controller.window.document, "identity-popup-encryption-icon");
  var cssInfoLockImage = utils.getElementStyle(lockIcon, 'list-style-image');
  var lockImageVisible = (cssInfoLockImage !== 'none');

  controller.assert(function () {
    return lockImageVisible;
  }, "There is a lock icon - got '" + lockImageVisible + "', expected 'true'.");

  // Check the site identifier string against the Cert
  // XXX: Larry strips the 'www.' from the CName using the eTLDService
  //      This is expected behaviour for the time being (Bug 443116)
  var host = new elementslib.ID(controller.window.document, "identity-popup-content-host");
  controller.assertJSProperty(host, "textContent", gETLDService.getBaseDomainFromHost(cert.commonName));

  // Check the owner identifier string, should be "(unknown)"
  var owner = new elementslib.ID(controller.window.document, "identity-popup-content-owner");
  var property = utils.getProperty("chrome://browser/locale/browser.properties",
                                   "identity.ownerUnknown2");
  controller.assertJSProperty(owner, "textContent", property);

  // Check the "Verified by: %S" string
  var l10nVerifierLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                            "identity.identified.verifier");
  l10nVerifierLabel = l10nVerifierLabel.replace("%S", cert.issuerOrganization);
  var verifier = new elementslib.ID(controller.window.document, "identity-popup-content-verifier");
  controller.assertJSProperty(verifier, "textContent", l10nVerifierLabel);

  // Check the Encryption Label text
  var l10nEncryptionLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                              "identity.encrypted");
  var encryptionLabel = new elementslib.ID(controller.window.document, "identity-popup-encryption-label");
  controller.assertJSProperty(encryptionLabel, "textContent", l10nEncryptionLabel);

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
  // Check that the Security tab is selected by default
  var securityTab = new elementslib.ID(controller.window.document, "securityTab");
  controller.assertJSProperty(securityTab, "selected", "true");

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

/**
 * Map test functions to litmus tests
 */
// testLarryBlue.meta = {litmusids : [8901]};
