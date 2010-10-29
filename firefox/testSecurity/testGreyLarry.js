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

// Include required modules
var utils = require("../../shared-modules/utils");

var setupModule = function(module) {
  module.controller = mozmill.getBrowserController();
}

/**
 * Test the Larry displays as GREY
 */
var testLarryGrey = function() {
  // Go to a "grey" website
  controller.open("http://www.mozilla.org");
  controller.waitForPageLoad();

  // Check the favicon
  var favicon = new elementslib.ID(controller.window.document, "page-proxy-favicon");
  controller.assertJSProperty(favicon, "src" ,"http://www.mozilla.org/favicon.ico");

  // Check the favicon has no label
  controller.assertValue(new elementslib.ID(controller.window.document,
                                            "identity-icon-label"), "");

  // Click the identity button to display Larry
  controller.click(new elementslib.ID(controller.window.document, "identity-box"));

  // Make sure the doorhanger is "open" before continuing
  var doorhanger = new elementslib.ID(controller.window.document, "identity-popup");
  controller.waitForEval("subject.state == 'open'", 2000, 100, doorhanger.getNode());

  // Check that the Larry UI is unknown (aka Grey)
  controller.assertJSProperty(doorhanger, "className", "unknownIdentity");

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

  // Check the Web Site label for "www.mozilla.org"
  var webIDDomainLabel = new elementslib.ID(controller.window.document,
                                            "security-identity-domain-value");
  controller.assertValue(webIDDomainLabel, "www.mozilla.org");

  // Check the Owner label for "This web site does not supply ownership information."
  var webIDOwnerLabel = new elementslib.ID(controller.window.document,
                                           "security-identity-owner-value");
  var securityOwner = utils.getProperty("chrome://browser/locale/pageInfo.properties",
                                        "securityNoOwner");
  controller.assertValue(webIDOwnerLabel, securityOwner);

  // Check the Verifier label for "Not Specified"
  var webIDVerifierLabel = new elementslib.ID(controller.window.document,
                                              "security-identity-verifier-value");
  var securityIdentifier = utils.getProperty("chrome://browser/locale/pageInfo.properties",
                                             "notset");
  controller.assertValue(webIDVerifierLabel, securityIdentifier);

  controller.keypress(null, 'VK_ESCAPE', {});
}

/**
 * Map test functions to litmus tests
 */
// testLarryGrey.meta = {litmusids : [6777]};
