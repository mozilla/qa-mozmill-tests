/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var toolbars = require("../../../lib/toolbars");
var utils = require("../../../lib/utils");

const BASE_URL = collector.addHttpResource("../../../../data/");
const TEST_DATA = BASE_URL + "layout/mozilla.html";

var setupModule = function(aModule) {
  aModule.controller = mozmill.getBrowserController();
  aModule.locationBar = new toolbars.locationBar(aModule.controller);
}

/**
 * Test the Larry displays as GREY
 */
var testLarryGrey = function() {
  // Go to a "grey" website
  controller.open(TEST_DATA);
  controller.waitForPageLoad();

  var favicon = new elementslib.ID(controller.window.document, "page-proxy-favicon");
  expect.ok(!favicon.getNode().hidden, "The globe favicon is visible");

  var identityIconLabel = new elementslib.ID(controller.window.document,
                                             "identity-icon-label");
  expect.equal(identityIconLabel.getNode().value, "", "The favicon has no label");

  locationBar.waitForNotificationPanel(() => {
    var identityBox = locationBar.getElement({type: "identityBox"});
    identityBox.click();
  }, {type: "identity"});

  var doorhanger = locationBar.getElement({type: "identityPopup"});
  expect.equal(doorhanger.getNode().className, "unknownIdentity",
               "The Larry UI is unknown (aka Grey)");

  // Check the More Information button
  var moreInfoButton = new elementslib.ID(controller.window.document,
                                          "identity-popup-more-info-button");
  controller.click(moreInfoButton);

  utils.handleWindow("type", "Browser:page-info", checkSecurityTab);
}

/**
 * Check the security tab of the page info window
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function checkSecurityTab(aController) {
  var securityTab = new elementslib.ID(aController.window.document, "securityTab");
  expect.ok(securityTab.getNode().selected, "The Security tab is selected by default");

  // Check the Web Site label for "localhost:port#"
  var webIDDomainLabel = new elementslib.ID(aController.window.document,
                                            "security-identity-domain-value");
  expect.match(webIDDomainLabel.getNode().value, /\/\/(.*[^\/])/.exec(BASE_URL)[1],
               "The domain label should equal the domain");

  // Check the Owner label for "This web site does not supply ownership information."
  var webIDOwnerLabel = new elementslib.ID(aController.window.document,
                                           "security-identity-owner-value");
  var securityOwner = utils.getProperty("chrome://browser/locale/pageInfo.properties",
                                        "securityNoOwner");
  expect.equal(webIDOwnerLabel.getNode().value, securityOwner,
               "The owner label should equal the security owner");

  var webIDVerifierLabel = new elementslib.ID(aController.window.document,
                                              "security-identity-verifier-value");
  var securityIdentifier = utils.getProperty("chrome://browser/locale/pageInfo.properties",
                                             "notset");
  expect.equal(webIDVerifierLabel.getNode().value, securityIdentifier,
               "Verifier label present for 'Not Specified'");

  aController.keypress(null, 'VK_ESCAPE', {});
}
