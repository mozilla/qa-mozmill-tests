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
 * Portions created by the Initial Developer are Copyright (C) 2009
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
var RELATIVE_ROOT = '../../shared-modules';
var MODULE_REQUIRES = ['UtilsAPI'];

const gDelay = 0;
const gTimeout = 5000;

var setupModule = function(module) {
  controller = mozmill.getBrowserController();

  cert = null;
}

/**
 * Test clicking the padlock in the statusbar opens the Page Info dialog
 * to the Security tab
 */
var testSecurityInfoViaPadlock = function() {
  // Go to a secure website
  controller.open("https://www.verisign.com/");
  controller.waitForPageLoad();

  // Get the information from the certificate for comparison
  var secUI = controller.window.getBrowser().mCurrentBrowser.securityUI;
  cert = secUI.QueryInterface(Ci.nsISSLStatusProvider).SSLStatus.serverCert;

  // Double click the padlock icon
  controller.doubleClick(new elementslib.ID(controller.window.document,
                                            "security-button"));

  UtilsAPI.handleWindow("type", "Browser:page-info", checkSecurityTab);
}

/**
 * Check the security tab of the page info window
 * @param {MozMillController} controller
 *        MozMillController of the window to operate on
 */
function checkSecurityTab(controller) {
  // Check that the Security tab is selected by default
  var securityTab = new elementslib.ID(controller.window.document, "securityTab");
  controller.assertProperty(securityTab, "selected", "true");

  // Check the Web Site label against the Cert CName
  var webIDDomainLabel = new elementslib.ID(controller.window.document,
                                            "security-identity-domain-value");
  controller.waitForEval("subject.domainLabel.indexOf(subject.CName) != -1", gTimeout, 100,
                                 {domainLabel: webIDDomainLabel.getNode().value,
                                  CName: cert.commonName});

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
// testSecurityInfoViaPadlock.meta = {litmusids : [6163]};
