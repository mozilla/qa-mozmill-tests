/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var {expect} = require("../../../lib/assertions");
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
  controller.assertValue(identOrganizationLabel, cert.organization);
  controller.assertValue(identCountryLabel, '(' + country + ')');

  // Check the favicon
  var favicon = new elementslib.ID(controller.window.document, "page-proxy-favicon");
  controller.waitFor(function () {
    return favicon.getNode().getAttribute("hidden") == false;
  }, "Lock icon is visible in identity box");

  var identityBox = new elementslib.ID(controller.window.document, "identity-box");
  expect.equal(identityBox.getNode().className, "verifiedIdentity", "Identity is verified");

  // Click the identity button to display Larry
  controller.click(identityBox);

  // Make sure the doorhanger is "open" before continuing
  var doorhanger = new elementslib.ID(controller.window.document, "identity-popup");
  controller.waitFor(function () {
    return doorhanger.getNode().state === 'open';
  }, "Identity popup has been opened");

  expect.equal(doorhanger.getNode().className, "verifiedIdentity", "Larry UI is verified aka Green");

  // Check for the Lock icon is visible
  var lockIcon = new elementslib.ID(controller.window.document, "identity-popup-encryption-icon");
  var cssInfoLockImage = utils.getElementStyle(lockIcon, 'list-style-image');

  expect.notEqual(cssInfoLockImage, "none", "There is a lock icon");

  // XXX: Larry strips the 'www.' from the CName using the eTLDService
  //      This is expected behaviour for the time being (bug 443116)
  var host = new elementslib.ID(controller.window.document, "identity-popup-content-host");
  expect.equal(host.getNode().textContent, gETLDService.getBaseDomainFromHost(cert.commonName),
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
                                              "identity.encrypted");
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
  controller.waitFor(function () {
    return webIDDomainLabel.getNode().value.indexOf(cert.commonName) !== -1;
  }, "Found certificate common name '" + cert.commonName + "'");

  // Check the Owner label against the Cert Owner
  var webIDOwnerLabel = new elementslib.ID(controller.window.document,
                                           "security-identity-owner-value");
  controller.assertValue(webIDOwnerLabel, cert.organization);

  // Check the Verifier label against the Cert Issuer
  var webIDVerifierLabel = new elementslib.ID(controller.window.document,
                                              "security-identity-verifier-value");
  controller.assertValue(webIDVerifierLabel, cert.issuerOrganization);

  controller.keypress(null, 'VK_ESCAPE', {});
}

/**
 * Map test functions to litmus tests
 */
// testLarryGreen.meta = {litmusids : [8805]};
