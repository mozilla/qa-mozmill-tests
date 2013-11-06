/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var utils = require("../../../lib/utils");

const TEST_DATA = "https://addons.mozilla.org/licenses/5.txt";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();

  aModule.cert = null;
}

/**
 * Test the Larry displays GREEN
 */
var testLarryGreen = function() {
  // Go to a "green" website
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the information from the certificate for comparison
  var securityUI = controller.window.getBrowser().mCurrentBrowser.securityUI;
  cert = securityUI.QueryInterface(Ci.nsISSLStatusProvider).SSLStatus.serverCert;

  var country = cert.subjectName.substring(cert.subjectName.indexOf("C=") + 2,
                                           cert.subjectName.indexOf(",postalCode="));

  // Check the label displays
  // Format: Organization (CountryCode)
  var identOrganizationLabel = new elementslib.ID(controller.window.document,
                                                  "identity-icon-label");
  var identCountryLabel = new elementslib.ID(controller.window.document,
                                             "identity-icon-country-label");
  expect.equal(identOrganizationLabel.getNode().value, cert.organization,
               "Certificate's organization is displayed");
  expect.equal(identCountryLabel.getNode().value, '(' + country + ')',
               "Certificate's country code is displayed");

  // Check the favicon
  var favicon = new elementslib.ID(controller.window.document, "page-proxy-favicon");
  assert.waitFor(function () {
    return favicon.getNode().getAttribute("hidden") == false;
  }, "Lock icon is visible in identity box");

  var identityBox = new elementslib.ID(controller.window.document, "identity-box");
  expect.equal(identityBox.getNode().className, "verifiedIdentity", "Identity is verified");

  // Click the identity button to display Larry
  controller.click(identityBox);

  // Make sure the doorhanger is "open" before continuing
  var doorhanger = new elementslib.ID(controller.window.document, "identity-popup");
  assert.waitFor(function () {
    return doorhanger.getNode().state === 'open';
  }, "Identity popup has been opened");

  expect.equal(doorhanger.getNode().className, "verifiedIdentity", "Larry UI is verified aka Green");

  // Check for the Lock icon is visible
  var lockIcon = new elementslib.ID(controller.window.document, "identity-popup-encryption-icon");
  var cssInfoLockImage = utils.getElementStyle(lockIcon, 'list-style-image');

  expect.notEqual(cssInfoLockImage, "none", "There is a lock icon");

  // Bug 443116
  // Larry strips the 'www.' from the CName using the eTLDService
  // This is expected behaviour for the time being
  var host = new elementslib.ID(controller.window.document, "identity-popup-content-host");
  expect.equal(host.getNode().textContent, Services.eTLD.getBaseDomainFromHost(cert.commonName),
               "The site identifier string is equal to the Cert host");

  var owner = new elementslib.ID(controller.window.document, "identity-popup-content-owner");
  expect.equal(owner.getNode().textContent, cert.organization,
               "Owner string is equal to the Cert organization");

  // Check the owner location string against the Cert
  // Format: City
  //         State, Country Code
  var city = cert.subjectName.substring(cert.subjectName.indexOf("L=") + 2,
                                        cert.subjectName.indexOf(",ST="));
  var state = cert.subjectName.substring(cert.subjectName.indexOf("ST=") + 3,
                                         cert.subjectName.indexOf(",C="));
  var country = cert.subjectName.substring(cert.subjectName.indexOf("C=") + 2,
                                           cert.subjectName.indexOf(",postalCode="));
  var locationLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                        "identity.identified.state_and_country");
  var updateLocationLabel = locationLabel.replace("%S", state).replace("%S", country);
  var location = city + '\n' + updateLocationLabel;
  var ownerLocation = new elementslib.ID(controller.window.document,
                                         "identity-popup-content-supplemental");
  expect.equal(ownerLocation.getNode().textContent, location,
               "Owner location string is equal to the Cert location");

  var l10nVerifierLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                            "identity.identified.verifier");
  l10nVerifierLabel = l10nVerifierLabel.replace("%S", cert.issuerOrganization);
  var verifier = new elementslib.ID(controller.window.document,
                                    "identity-popup-content-verifier");
  expect.equal(verifier.getNode().textContent, l10nVerifierLabel,
               "The 'Verified by: %S' string is set");

  var l10nEncryptionLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                              "identity.encrypted2");
  var label = new elementslib.ID(controller.window.document,
                                 "identity-popup-encryption-label");
  expect.equal(label.getNode().textContent, l10nEncryptionLabel, "Encryption Label text is set");

  // Check the More Information button
  var moreInfoButton = new elementslib.ID(controller.window.document,
                                          "identity-popup-more-info-button");
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
  expect.ok(securityTab.getNode().selected, "Security tab is selected by default");

  // Check the Web Site label against the Cert CName
  var webIDDomainLabel = new elementslib.ID(controller.window.document,
                                            "security-identity-domain-value");
  expect.notEqual(webIDDomainLabel.getNode().value.indexOf(cert.commonName), -1,
                  "Found certificate common name '" + cert.commonName + "'");

  var webIDOwnerLabel = new elementslib.ID(controller.window.document,
                                           "security-identity-owner-value");
  expect.equal(webIDOwnerLabel.getNode().value, cert.organization,
               "Owner matches certificate's organization");

  var webIDVerifierLabel = new elementslib.ID(controller.window.document,
                                              "security-identity-verifier-value");
  expect.equal(webIDVerifierLabel.getNode().value, cert.issuerOrganization,
               "Verifier matches certificate's issuer");

  controller.keypress(null, 'VK_ESCAPE', {});
}
