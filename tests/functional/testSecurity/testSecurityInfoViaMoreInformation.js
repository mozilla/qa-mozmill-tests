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
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Aaron Train <atrain@mozilla.com>
 *   Anthony Hughes <ahughes@mozilla.com>
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
var utils = require("../../../lib/utils");

const TIMEOUT = 5000;

var setupModule = function() {
  controller = mozmill.getBrowserController();
  cert = null;
}

/**
 * Test clicking the 'More Information' button in Larry, 
 * to open the Page Info dialog to the Security tab
 */
var testSecurityInfoViaMoreInformation = function() {
  // Go to a secure website
  controller.open("https://addons.mozilla.org/licenses/5.txt");
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
  controller.waitForEval("subject.state == 'open'", TIMEOUT, 100, doorhanger.getNode());
  
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
  controller.assertJSProperty(securityTab, "selected", true);

  // Check the Web Site label against the Cert CName
  var webIDDomainLabel = new elementslib.ID(controller.window.document,
                                            "security-identity-domain-value");
  controller.waitForEval("subject.domainLabel.value.indexOf(subject.CName) != -1", TIMEOUT, 100, {
               domainLabel: webIDDomainLabel.getNode(),
               CName: cert.commonName
             });

  // Check the Owner label against the Cert Owner
  var webIDOwnerLabel = new elementslib.ID(controller.window.document,
                                           "security-identity-owner-value");
  controller.assertValue(webIDOwnerLabel, cert.organization);

  // Check the Verifier label against the Cert Issuer
  var webIDVerifierLabel = new elementslib.ID(controller.window.document,
                                              "security-identity-verifier-value");
  controller.assertValue(webIDVerifierLabel, cert.issuerOrganization);

  // Close the Page Info window by pressing Escape
  controller.keypress(null, 'VK_ESCAPE', {});
}
