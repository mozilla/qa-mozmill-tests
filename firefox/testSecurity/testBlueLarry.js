/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozmill Test Code.
 *
 * The Initial Developer of the Original Code is the Mozilla Foundation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Anthony Hughes <ashughes@mozilla.com>
 *   Henrik Skupin <hskupin@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Include necessary modules
var utils = require("../../shared-modules/utils");

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
  controller.open("https://mail.mozilla.org/");
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
  controller.assertJSProperty(favicon, "src" ,"https://mail.mozilla.org/icons/mm-icon.png");

  // Check the identity box shows green
  var identityBox = new elementslib.ID(controller.window.document, "identity-box");
  controller.assertJSProperty(identityBox, "className", "verifiedDomain");

  // Click the identity button to display Larry
  controller.click(identityBox);

  // Make sure the doorhanger is "open" before continuing
  var doorhanger = new elementslib.ID(controller.window.document, "identity-popup");
  controller.waitForEval("subject.state == 'open'", 2000, 100, doorhanger.getNode());

  // Check that the Larry UI is domain verified (aka Blue)
  controller.assertJSProperty(doorhanger, "className", "verifiedDomain");

  // Check for the Lock icon is visible
  var lockIcon = new elementslib.ID(controller.window.document, "identity-popup-encryption-icon");
  var cssInfoLockImage = controller.window.getComputedStyle(lockIcon.getNode(), "");
  controller.assertJS("subject.getPropertyValue('list-style-image') != 'none'", cssInfoLockImage);

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
  // XXX: This cert uses a wildcard (*) in the CName
  //      Replace this with 'www' as it is the current domain
  var webIDDomainLabel = new elementslib.ID(controller.window.document,
                                            "security-identity-domain-value");
  controller.assertValue(webIDDomainLabel, cert.commonName.replace("*", "wiki"));

  // Check the Owner label for "This web site does not supply ownership information."
  var webIDOwnerLabel = new elementslib.ID(controller.window.document,
                                           "security-identity-owner-value");
  var securityOwner = utils.getProperty("chrome://browser/locale/pageInfo.properties",
                                        "securityNoOwner");
  controller.assertValue(webIDOwnerLabel, securityOwner);

  // Check the Verifier label against the Cert Issuer
  var webIDVerifierLabel = new elementslib.ID(controller.window.document,
                                              "security-identity-verifier-value");
  controller.assertValue(webIDVerifierLabel, cert.issuerOrganization);

  controller.keypress(null, 'VK_ESCAPE', {});
}

/**
 * Map test functions to litmus tests
 */
// testLarryBlue.meta = {litmusids : [8901]};
