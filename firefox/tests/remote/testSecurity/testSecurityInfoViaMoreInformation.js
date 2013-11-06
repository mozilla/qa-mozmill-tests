/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var utils = require("../../../lib/utils");

const TEST_DATA = "https://addons.mozilla.org/licenses/5.txt";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.cert = null;
}

/**
 * Test clicking the 'More Information' button in Larry,
 * to open the Page Info dialog to the Security tab
 */
var testSecurityInfoViaMoreInformation = function() {
  // Go to a secure website
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  // Get the information from the certificate for comparison
  var secUI = controller.window.getBrowser().mCurrentBrowser.securityUI;
  cert = secUI.QueryInterface(Ci.nsISSLStatusProvider).SSLStatus.serverCert;

  // Click the Identity Box
  var identityBox = new elementslib.ID(controller.window.document,
                                       "identity-box");
  controller.click(identityBox);

  // Make sure the doorhanger is "open" before continuing
  var doorhanger = new elementslib.ID(controller.window.document, "identity-popup");
  assert.waitFor(function () {
    return doorhanger.getNode().state === 'open';
  }, "Identity doorhanger is open: got '" + doorhanger.getNode().state + "', expected 'open'");

  // Click the 'More Information' button in the Larry popup notification
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
  expect.ok(securityTab.getNode().selected, "Security tab is selected");

  // Check the Web Site label against the Cert CName
  var webIDDomainLabel = new elementslib.ID(controller.window.document,
                                            "security-identity-domain-value");
  expect.equal(webIDDomainLabel.getNode().value, cert.commonName,
               "Domain found in Cerificate Common Name");

  // Check the Owner label against the Cert Owner
  var webIDOwnerLabel = new elementslib.ID(controller.window.document,
                                           "security-identity-owner-value");
  expect.equal(webIDOwnerLabel.getNode().value, cert.organization,
               "Certificate Owner matches Website Owner");

  // Check the Verifier label against the Cert Issuer
  var webIDVerifierLabel = new elementslib.ID(controller.window.document,
                                              "security-identity-verifier-value");
  expect.equal(webIDVerifierLabel.getNode().value, cert.issuerOrganization,
               "Certificate Verifier matches Website Verifier");

  // Close the Page Info window by pressing Escape
  controller.keypress(null, 'VK_ESCAPE', {});
}
