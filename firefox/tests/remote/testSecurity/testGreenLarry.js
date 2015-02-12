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
 * Test the Larry displays GREEN
 */
var testLarryGreen = function() {
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the information from the certificate for comparison
  cert = security.getCertificate(browserWindow.tabs.securityUI);

  var country = cert.subjectName.substring(cert.subjectName.indexOf("C=") + 2,
                                           cert.subjectName.indexOf(",postalCode="));

  // Check the label displays
  // Format: Organization (CountryCode)
  var orgLabel = identityPopup.getElement({type: "organizationLabel"});
  var countryLabel = identityPopup.getElement({type: "countryLabel"});
  expect.equal(orgLabel.getNode().value, cert.organization,
               "Certificate's organization is displayed");
  expect.equal(countryLabel.getNode().value, '(' + country + ')',
               "Certificate's country code is displayed");

  // Check the favicon
  var favicon = locationBar.getElement({type: "favicon"});
  assert.waitFor(function () {
    return favicon.getNode().getAttribute("hidden") == false;
  }, "Lock icon is visible in identity box");

  var identityBox = identityPopup.getElement({type: "box"});
  expect.equal(identityBox.getNode().className, "verifiedIdentity",
               "Identity is verified");

  locationBar.waitForNotificationPanel(aPanel => {
    targetPanel = aPanel;

    identityBox.click();
  }, {type: "identity"});

  var doorhanger = identityPopup.getElement({type: "popup"});

  expect.equal(doorhanger.getNode().className, "verifiedIdentity",
               "Larry UI is verified aka Green");

  // Check for the Lock icon is visible
  var lockIcon = identityPopup.getElement({type: "encryptionIcon"});
  var cssInfoLockImage = utils.getElementStyle(lockIcon, 'list-style-image');

  expect.notEqual(cssInfoLockImage, "none", "There is a lock icon");

  // Bug 443116
  // Larry strips the 'www.' from the CName using the eTLDService
  // This is expected behaviour for the time being
  var host = identityPopup.getElement({type: "host"});
  expect.equal(host.getNode().textContent,
               Services.eTLD.getBaseDomainFromHost(cert.commonName),
               "The site identifier string is equal to the Cert host");

  var owner = identityPopup.getElement({type: "owner"});
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
  var ownerLocation = identityPopup.getElement({type: "ownerLocation"});
  expect.equal(ownerLocation.getNode().textContent, location,
               "Owner location string is equal to the Cert location");

  var l10nVerifierLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                            "identity.identified.verifier");
  l10nVerifierLabel = l10nVerifierLabel.replace("%S", cert.issuerOrganization);
  var verifier = identityPopup.getElement({type: "verifier"});
  expect.equal(verifier.getNode().textContent, l10nVerifierLabel,
               "The 'Verified by: %S' string is set");

  var l10nEncryptionLabel = utils.getProperty("chrome://browser/locale/browser.properties",
                                              "identity.encrypted2");
  var label = identityPopup.getElement({type: "encryptionLabel"});
  expect.equal(label.getNode().textContent, l10nEncryptionLabel, "Encryption Label text is set");

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
  expect.ok(securityTab.getNode().selected, "Security tab is selected by default");

  // Check the Web Site label against the Cert CName
  var webIDDomainLabel = new elementslib.ID(aController.window.document,
                                            "security-identity-domain-value");
  expect.notEqual(webIDDomainLabel.getNode().value.indexOf(cert.commonName), -1,
                  "Found certificate common name '" + cert.commonName + "'");

  var webIDOwnerLabel = new elementslib.ID(aController.window.document,
                                           "security-identity-owner-value");
  expect.equal(webIDOwnerLabel.getNode().value, cert.organization,
               "Owner matches certificate's organization");

  var webIDVerifierLabel = new elementslib.ID(aController.window.document,
                                              "security-identity-verifier-value");
  expect.equal(webIDVerifierLabel.getNode().value, cert.issuerOrganization,
               "Verifier matches certificate's issuer");

  aController.keypress(null, 'VK_ESCAPE', {});
}
