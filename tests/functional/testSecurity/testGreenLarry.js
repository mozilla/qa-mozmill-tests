/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { assert, expect } = require("../../../lib/assertions");
var utils = require("../../../lib/utils");

var TIMEOUT = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();

  // Effective TLD Service for grabbing certificate info
  gETLDService = Cc["@mozilla.org/network/effective-tld-service;1"].
                 getService(Ci.nsIEffectiveTLDService);
  cert = null;
}

/**
 * Test the Larry displays GREEN
 */
var testLarryGreen = function() {
  // Go to a "green" website
  controller.open("https://addons.mozilla.org/licenses/5.txt");
  controller.waitForPageLoad();

  // Get the information from the certificate for comparison
  var securityUI = controller.window.getBrowser().mCurrentBrowser.securityUI;
  cert = securityUI.QueryInterface(Ci.nsISSLStatusProvider).SSLStatus.serverCert;

  var country = cert.subjectName.substring(cert.subjectName.indexOf("C=") + 2,
                                           cert.subjectName.indexOf(",serialNumber="));

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
    return favicon.getNode().src.indexOf('addons.cdn.mozilla') != -1;
  }, "AMO favicon is loaded.");

  // Check the identity box shows green
  var identityBox = new elementslib.ID(controller.window.document, "identity-box");
  controller.assertJSProperty(identityBox, "className", "verifiedIdentity");

  // Click the identity button to display Larry
  controller.click(identityBox);

  // Make sure the doorhanger is "open" before continuing
  var doorhanger = new elementslib.ID(controller.window.document, "identity-popup");
  assert.waitFor(function () {
    return doorhanger.getNode().state === 'open';
  }, "Identity popup has been opened");

  // Check that the Larry UI is verified (aka Green)
  controller.assertJSProperty(doorhanger, "className", "verifiedIdentity");

  // Check for the Lock icon is visible
  var lockIcon = new elementslib.ID(controller.window.document, "identity-popup-encryption-icon");
  var cssInfoLockImage = utils.getElementStyle(lockIcon, 'list-style-image');

  expect.notEqual(cssInfoLockImage, "none", "There is a lock icon");

  // Check the site identifier string against the Cert
  // XXX: Larry strips the 'www.' from the CName using the eTLDService
  //      This is expected behaviour for the time being (bug 443116)
  var host = new elementslib.ID(controller.window.document, "identity-popup-content-host");
  controller.assertJSProperty(host, "textContent", gETLDService.getBaseDomainFromHost(cert.commonName));

  // Check the owner string against the Cert
  var owner = new elementslib.ID(controller.window.document, "identity-popup-content-owner");
  controller.assertJSProperty(owner, "textContent", cert.organization);

  // Check the owner location string against the Cert
  // Format: City
  //         State, Country Code
  var city = cert.subjectName.substring(cert.subjectName.indexOf("L=") + 2,
                                        cert.subjectName.indexOf(",ST="));
  var state = cert.subjectName.substring(cert.subjectName.indexOf("ST=") + 3,
                                         cert.subjectName.indexOf(",C="));
  var country = cert.subjectName.substring(cert.subjectName.indexOf("C=") + 2,
                                           cert.subjectName.indexOf(",serialNumber="));
  // Arabic locales have it's own comma: http://www.w3.org/International/Spread/raw.txt
  var commaList = {'ar': '\u060c', 'fa': '\u060c'};
  if (utils.appInfo.locale in commaList)
    var comma = commaList[utils.appInfo.locale];
  else
    var comma = ',';
  var location = city + '\n' + state + comma + ' ' + country;
  var ownerLocation = new elementslib.ID(controller.window.document,
                                         "identity-popup-content-supplemental");
  controller.assertJSProperty(ownerLocation, "textContent", location);

  // Check the "Verified by: %S" string
  var l10nVerifierLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                            "identity.identified.verifier");
  l10nVerifierLabel = l10nVerifierLabel.replace("%S", cert.issuerOrganization);
  var verifier = new elementslib.ID(controller.window.document,
                                    "identity-popup-content-verifier");
  controller.assertJSProperty(verifier, "textContent", l10nVerifierLabel);

  // Check the Encryption Label text
  var l10nEncryptionLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                              "identity.encrypted");
  var label = new elementslib.ID(controller.window.document,
                                 "identity-popup-encryption-label");
  controller.assertJSProperty(label, "textContent", l10nEncryptionLabel);

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
  // Check that the Security tab is selected by default
  var securityTab = new elementslib.ID(controller.window.document, "securityTab");
  controller.assertJSProperty(securityTab, "selected", "true");

  // Check the Web Site label against the Cert CName
  var webIDDomainLabel = new elementslib.ID(controller.window.document,
                                            "security-identity-domain-value");
  expect.waitFor(function () {
    return webIDDomainLabel.getNode().value.indexOf(cert.commonName) !== -1;
  }, "Found certificate common name '" + cert.commonName + "'");

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

/**
 * Map test functions to litmus tests
 */
// testLarryGreen.meta = {litmusids : [8805]};
