/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Include necessary modules
var { assert, expect } = require("../../../../lib/assertions");
var domUtils = require("../../../../lib/dom-utils")
var modalDialog = require("../../../../lib/modal-dialog");

const TEST_DATA = {
  link : "http://quality.mozilla.org",
  url_ca : "http://mozqa.com/data/firefox/security/certificates/md5/importSSL.php",
  url_page : "https://ssl-md5.mozqa.com"
}
const TIMEOUT_MODAL_DIALOG = 30000;

function setupModule(aModule) {
  aModule.controller = mozmill.getBrowserController();
}

/**
 * Test that MD5 Hash Signatures are not valid
 */
function testMD5HashSignature() {
  // Create a listener for the "Downloading Certificate" dialog
  var md = new modalDialog.modalDialog(controller.window);
  md.start(handleDownloadingCertificateDialog);
  controller.open(TEST_DATA.url_ca);

  md.waitForDialog(TIMEOUT_MODAL_DIALOG);

  controller.open(TEST_DATA.url_page);
  controller.waitForPageLoad();

  // Bug 863139
  // TODO: Move all elements to the Security shared module
  // Expand the "I Understand the Risks" section
  var expertContentHeading = new elementslib.ID(controller.tabs.activeTab,
                                                "expertContent");
  var expertContentButton = expertContentHeading.getNode().childNodes[1];
  expertContentButton.click();

  // Click the "Add Exception" button
  var exceptionDialogButton = new elementslib.ID(controller.tabs.activeTab,
                                                 "exceptionDialogButton");

  // Add a listener for the "Add Security Exception" dialog
  md.start(handleAddSecurityExceptionDialog);
  controller.waitThenClick(exceptionDialogButton);
  md.waitForDialog(TIMEOUT_MODAL_DIALOG);

  // Verify the test page has been loaded
  controller.waitForPageLoad();

  var linkNode = controller.tabs.activeTab.querySelector("a");
  assert.contain(linkNode.textContent, TEST_DATA.link,
                 "Page has been loaded");
}

/**
 * Handle the Downloading Certificate dialog
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function handleDownloadingCertificateDialog(aController) {
  // Bug 863139
  // TODO: Move all elements to the Security shared module
  // Get all trusting options and make sure are checked
  var trustElements = ["trustSSL", "trustEmail", "trustObjSign"];
  trustElements.forEach(function (aId) {
    var aTrustObj = new elementslib.ID(aController.window.document, aId);
    if (!aTrustObj.getNode().checked) {
      aController.click(aTrustObj);
    }
    expect.ok(aTrustObj.getNode().checked);
  });

  // Click the "OK" button to close the dialog
  var root = aController.window.document;
  var nodeCollector = new domUtils.nodeCollector(root);
  nodeCollector.queryNodes("#download_cert");
  nodeCollector.root = nodeCollector.nodes[0];
  nodeCollector.queryAnonymousNode("dlgtype", "accept");

  var acceptButton = nodeCollector.nodes[0];
  aController.click(acceptButton);
}

/**
 * Handle the "Add Security Exception" dialog
 * @param {MozMillController} aController
 *        MozMillController of the window to operate on
 */
function handleAddSecurityExceptionDialog(aController) {
  // Fetch and populate the certificate
  var getCertificateButton = new elementslib.ID(aController.window.document,
                                                "checkCertButton");
  aController.click(getCertificateButton);

  // Click the "Confirm Security Exception" button
  var root = aController.window.document;
  var nodeCollector = new domUtils.nodeCollector(root);
  nodeCollector.queryNodes("#exceptiondialog");
  nodeCollector.root = nodeCollector.nodes[0];
  nodeCollector.queryAnonymousNode("dlgtype", "extra1");

  var exceptionButton = nodeCollector.nodes[0]
  assert.waitFor(function() {
    return !exceptionButton.disabled;
  }, "Add exception button is available");
  aController.click(exceptionButton);
}
