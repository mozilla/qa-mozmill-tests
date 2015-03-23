/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var prefs = require("../../../../lib/prefs");
var security = require("../../../lib/security");
var tabs = require("../../../lib/tabs");
var utils = require("../../../../lib/utils");
var windows = require("../../../../lib/windows");

var browser = require("../../../lib/ui/browser");

const PREF_STARTUP_PAGE = "browser.startup.page";

const TEST_DATA = [{
  url: "https://ssl-dv.mozqa.com",
  identity: "",
  type: "verifiedDomain",
  callback: checkSecurityTab_DV
}, {
  url: "https://ssl-ev.mozqa.com/",
  identity: "Mozilla Corporation",
  type: "verifiedIdentity",
  callback: checkSecurityTab_EV
}, {
  url: "https://ssl-ov.mozqa.com/",
  identity: "",
  type: "verifiedDomain",
  callback: checkSecurityTab_OV
}];

function setupModule(aModule) {
  // Set browser to restore previous session
  prefs.setPref(PREF_STARTUP_PAGE, 3);
}

function setupTest(aModule) {
  aModule.browserWindow = new browser.BrowserWindow();
  aModule.controller = aModule.browserWindow.controller;
  aModule.locationBar = aModule.browserWindow.navBar.locationBar;

  aModule.tabBrowser = new tabs.tabBrowser(aModule.controller);

  // The cert variable is shared between different methods because of async callback
  aModule.cert = null;
  persisted.nextTest = null;
}

function teardownTest(aModule) {
  if (persisted.nextTest) {
    controller.restartApplication(persisted.nextTest);
  }
}

function teardownModule(aModule) {
  aModule.tabBrowser.closeAllTabs();

  delete persisted.nextTest;

  prefs.clearUserPref(PREF_STARTUP_PAGE);
}

/**
 * Bug 995801
 * Test the certificates' status after a browser restart
 */
function testDisplayCertificateStatus() {
  persisted.nextTest = "testDisplayCertificateStatusAfterRestart";
  tabBrowser.closeAllTabs();

  // Open a website for each certificate type
  TEST_DATA.forEach(aPage => {
    controller.open(aPage.url);
    controller.waitForPageLoad();

    locationBar.waitForProxyState();

    cert = security.getCertificate(tabBrowser.securityUI);
    verifyCertificateStatus(aPage);

    tabBrowser.openTab("newTabButton");
  });
}

function testDisplayCertificateStatusAfterRestart() {
  tabBrowser.selectedIndex = 0;

  // Check that the correct status is shown for each certificate type
  TEST_DATA.forEach(aPage => {
    controller.waitForPageLoad();

    locationBar.waitForProxyState();

    cert = security.getCertificate(tabBrowser.securityUI);
    verifyCertificateStatus(aPage);
    tabBrowser.selectedIndex++;
  });
}

function verifyCertificateStatus(aPage) {
  // Check the favicon
  var favicon = locationBar.getElement({type: "favicon"});
  expect.ok(!favicon.getNode().hasAttribute("hidden"),
            "Lock icon is visible in identity box for " + aPage.url);

  var identityBox = locationBar.identityPopup.getElement({type: "box"});
  locationBar.waitForNotificationPanel(() => {
    identityBox.click();
  }, {type: "identity"});

  var doorhanger = locationBar.identityPopup.getElement({type: "popup"});
  expect.equal(doorhanger.getNode().className, aPage.type,
               "Extended certificate is verified for " + aPage.url);

  var identityLabel = locationBar.identityPopup.getElement({type: "organizationLabel"});
  expect.equal(identityLabel.getNode().value, aPage.identity,
               "Identity name is correct for " + aPage.url);

  // Check the retrieved SSL certificate
  var moreInfoButton = locationBar.identityPopup.getElement({type: "moreInfoButton"});
  locationBar.waitForNotificationPanel(() => {
    moreInfoButton.click();
  }, {type: "identity", open: false});

  windows.handleWindow("type", "Browser:page-info", aPage.callback);
}

function checkSecurityTab_EV(aController) {
  var securityTab = findElement.ID(aController.window.document, "securityTab");
  expect.ok(securityTab.getNode().selected, "The security tab is selected by default");

  // Check the Web Site label against the Cert CName
  var domainElem = findElement.ID(aController.window.document,
                                  "security-identity-domain-value");
  expect.notEqual(domainElem.getNode().value.indexOf(cert.commonName), -1,
                  "Found certificate common name '" + cert.commonName + "'");

  var ownerElem = findElement.ID(aController.window.document,
                                 "security-identity-owner-value");
  expect.equal(ownerElem.getNode().value, cert.organization,
               "Owner matches certificate's organization");

  var verifierElem = findElement.ID(aController.window.document,
                                    "security-identity-verifier-value");
  expect.equal(verifierElem.getNode().value, cert.issuerOrganization,
               "Verifier matches certificate's issuer");
}

function checkSecurityTab_DV(aController) {
  var securityTab = findElement.ID(aController.window.document, "securityTab");
  expect.ok(securityTab.getNode().selected, "The Security tab is selected by default");

  // Check the Web Site label against the Cert CName
  var domainElem = findElement.ID(aController.window.document,
                                  "security-identity-domain-value");

  var certName = (cert.commonName.replace(/\./g, "\\\.")).replace(/\*/g, ".*");
  var certNameRegExp = new RegExp("^" + certName + "$");

  expect.match(domainElem.getNode().value, certNameRegExp,
               "Expected web site label found");

  // Check the Owner label for "This web site does not supply ownership information."
  var ownerElem = findElement.ID(aController.window.document,
                                 "security-identity-owner-value");
  var securityOwner = utils.getProperty("chrome://browser/locale/pageInfo.properties",
                                        "securityNoOwner");
  expect.equal(ownerElem.getNode().value, securityOwner,
               "Expected owner label found");

  // Check the Verifier against the Cert Issuer
  var verifierElem = findElement.ID(aController.window.document,
                                    "security-identity-verifier-value");
  expect.equal(verifierElem.getNode().value, cert.issuerOrganization,
               "Verifier matches certificate's issuer");
}

function checkSecurityTab_OV(aController) {
  var securityTab = findElement.ID(aController.window.document, "securityTab");
  expect.ok(securityTab.getNode().selected, "The Security tab is selected by default");

  // Check the Owner for "This web site does not supply ownership information."
  var ownerElem = findElement.ID(aController.window.document,
                                 "security-identity-owner-value");
  var securityOwner = utils.getProperty("chrome://browser/locale/pageInfo.properties",
                                        "securityNoOwner");

  expect.equal(ownerElem.getNode().value, securityOwner,
               "Expected owner label found");

  // Check the Verifier against the Cert Issuer
  var verifierElem = findElement.ID(aController.window.document,
                                    "security-identity-verifier-value");
  expect.equal(verifierElem.getNode().value, cert.issuerOrganization,
               "Verifier matches certificate's issuer");
}
