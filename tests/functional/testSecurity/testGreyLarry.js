/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// Include necessary modules
var {expect} = require("../../../lib/assertions");
var utils = require("../../../lib/utils");

const LOCAL_TEST_FOLDER = collector.addHttpResource("../../../data/");
const LOCAL_TEST_PAGE = LOCAL_TEST_FOLDER + 'layout/mozilla.html';

var setupModule = function(module) {
  controller = mozmill.getBrowserController();
}

/**
 * Test the Larry displays as GREY
 */
var testLarryGrey = function() {
  // Go to a "grey" website
  controller.open(LOCAL_TEST_PAGE);
  controller.waitForPageLoad();

  // Check the favicon
  var favicon = new elementslib.ID(controller.window.document, "page-proxy-favicon");
  controller.assertJSProperty(favicon, "src" , LOCAL_TEST_FOLDER + "images/mozilla_favicon.ico");

  // Check the favicon has no label
  controller.assertValue(new elementslib.ID(controller.window.document,
                                            "identity-icon-label"), "");

  // Click the identity button to display Larry
  controller.click(new elementslib.ID(controller.window.document, "identity-box"));

  // Make sure the doorhanger is "open" before continuing
  var doorhanger = new elementslib.ID(controller.window.document, "identity-popup");
  controller.waitFor(function () {
    return doorhanger.getNode().state === 'open';
  }, "Identity popup has been opened");

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

  // Check the Web Site label for "localhost:port#"
  var webIDDomainLabel = new elementslib.ID(controller.window.document,
                                            "security-identity-domain-value");
  expect.match(webIDDomainLabel.getNode().value, /\/\/(.*[^\/])/.exec(LOCAL_TEST_FOLDER)[1],
               "The domain label should equal the domain");

  // Check the Owner label for "This web site does not supply ownership information."
  var webIDOwnerLabel = new elementslib.ID(controller.window.document,
                                           "security-identity-owner-value");
  var securityOwner = utils.getProperty("chrome://browser/locale/pageInfo.properties",
                                        "securityNoOwner");
  expect.equal(webIDOwnerLabel.getNode().value, securityOwner,
               "The owner label should equal the security owner");

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
// testLarryGrey.meta = {litmusids : [8806]};
