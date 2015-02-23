/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var domUtils = require("../../../lib/dom-utils");
var prefs = require("../../../lib/prefs");
var softwareUpdate = require("../software-update");
var windows = require("../../../lib/windows");

var dialogs = require("../../../lib/ui/dialogs");

const WIZARD_PAGES = {
  dummy: 'dummy',
  checking: 'checking',
  pluginUpdatesFound: 'pluginupdatesfound',
  noUpdatesFound: 'noupdatesfound',
  manualUpdate: 'manualUpdate',
  unsupported: 'unsupported',
  incompatibleCheck: 'incompatibleCheck',
  updatesfoundbasic: 'updatesfoundbasic',
  updatesFoundBillboard: 'updatesfoundbillboard',
  license: 'license',
  incompatibleList: 'incompatibleList',
  downloading: 'downloading',
  errors: 'errors',
  errorextra: 'errorextra',
  errorPatching: 'errorpatching',
  finished: 'finished',
  finishedBackground: 'finishedBackground',
  installed: 'installed'
};

const TIMEOUT_UPDATE_DOWNLOAD = 360000;

// In the old Software Update UI, the errors are displayed in-dialog, for the new
// Software Update UI the errors are displayed in new prompts(dialogs). When
// the old UI is open we have to set the preference, so the errors will be shown as
// expected, otherwise we would have unhandled modal dialogs when errors are raised.
// http://mxr.mozilla.org/mozilla-central/source/toolkit/mozapps/update/nsUpdateService.js?rev=a9240b1eb2fb#4813
// http://mxr.mozilla.org/mozilla-central/source/toolkit/mozapps/update/nsUpdateService.js?rev=a9240b1eb2fb#4756
const PREF_APP_UPDATE_ALTWINDOWTYPE = "app.update.altwindowtype";

/**
 * UpdateWizardDialog class
 *
 * @constructor
 * @param {MozMillController} [aController]
 *        MozMillController of UpdateWizard window
 */
function UpdateWizardDialog(aController) {
  dialogs.CommonDialog.call(this, aController);

  this.softwareUpdate = new softwareUpdate.SoftwareUpdate();
  this._downloadDuration = -1;

  this.waitForWizardPageChanged(WIZARD_PAGES.dummy)
}

UpdateWizardDialog.prototype = Object.create(dialogs.CommonDialog.prototype);
UpdateWizardDialog.prototype.constructor = UpdateWizardDialog;

/**
 * Returns the current step of the software update dialog wizard
 *
 * @returns {String} Returns the current page Id as string
 */
UpdateWizardDialog.prototype.__defineGetter__('currentPage', function () {
  var wizard = this.getElement({type: "wizard"});

  return wizard.getNode().getAttribute('currentpageid');
});

/**
 * Returns information about the active update in the queue.
 *
 * @returns {object} The information about the active update
 */
UpdateWizardDialog.prototype.__defineGetter__('patchInfo', function () {
  var patch = this.softwareUpdate.patchInfo;
  patch.download_duration = this._downloadDuration;

  return patch;
});

/**
 * Check if updates have been found
 */
UpdateWizardDialog.prototype.__defineGetter__('updatesFound', function () {
  return this.currentPage.indexOf("updatesfound") == 0;
});

/**
 * Download the update
 *
 * @param {Boolean} [aWaitForFinish=true]
 *        Sets if the function should wait until the download has been finished
 * @param {Number} [aTimeout=360000]
 *        Time until the download should finish
 */
UpdateWizardDialog.prototype.download = function UWD_download(aWaitForFinish=true, aTimeout=TIMEOUT_UPDATE_DOWNLOAD) {
  prefs.setPref(PREF_APP_UPDATE_ALTWINDOWTYPE, "Update:Wizard");

  try {
    // Check that the correct channel has been set
    assert.equal(this.softwareUpdate.updateChannel.defaultChannel,
                 this.softwareUpdate.updateChannel.channel,
                 "The update channel has been set correctly.");

    // If updates are found, proceed to download
    if (this.currentPage === WIZARD_PAGES.updatesfoundbasic ||
        this.currentPage === WIZARD_PAGES.updatesFoundBillboard ||
        this.currentPage === WIZARD_PAGES.errorPatching) {
      this.selectNextPage();
    }

    // If incompatible add-on are installed we have to skip over the wizard page
    if (this.currentPage === WIZARD_PAGES.incompatibleList) {
      this.selectNextPage();
    }

    // It can happen that a download has been already cached and the 'finished'
    // page gets directly shown. Make sure we react correctly for different pages.
    switch (this.currentPage) {
      case WIZARD_PAGES.downloading:
        if (aWaitForFinish) {
          var startTime = Date.now();
          this.waitforDownloadFinished(aTimeout);

          assert.waitFor(() => this.currentPage === WIZARD_PAGES.finished ||
                         this.currentPage === WIZARD_PAGES.finishedBackground,
                         "Final wizard page has been selected. " + this.currentPage);

          // Calculate the download duration in ms
          this._downloadDuration = Date.now() - startTime;
        }
        break;
      case WIZARD_PAGES.finished:
      case WIZARD_PAGES.finishedBackground:
        break;
      default:
        assert.fail("Invalid wizard page for downloading an update: " + this.currentPage);
    }
  }
  finally {
    prefs.clearUserPref(PREF_APP_UPDATE_ALTWINDOWTYPE);
  }
};

/**
 * Retrieve list of UI elements based on the given specification
 *
 * @param {Object} aSpec
 *        Information of the UI elements which should be retrieved
 * @param {String} aSpec.type
 *        Identifier of the elements
 * @param {String} [aSpec.subtype]
 *        Specific element or property
 *
 * @returns {ElemBase[]} Elements which have been found
 */
UpdateWizardDialog.prototype.getElements = function UWD_getElements(aSpec) {
  var elements = [];
  var spec = aSpec || {};

  var root = spec.parent ? spec.parent.getNode() : this.controller.window;
  var nodeCollector = new domUtils.nodeCollector(root);

  switch (spec.type) {
    case "button":
      nodeCollector.root = this.getElement({type: "buttons"}).getNode();
      nodeCollector.queryAnonymousNode("dlgtype", spec.subtype);
      elements = nodeCollector.elements;
      break;
    case "buttons":
      nodeCollector.root = this.getElement({type: "wizard"}).getNode();
      nodeCollector.queryAnonymousNode("anonid", "Buttons");
      elements = nodeCollector.elements;
      break;
    case "download_progress":
      elements = [findElement.ID(this.controller.window.document,
                                 "downloadProgress")];
      break;
    case "wizard":
      elements = [findElement.ID(this.controller.window.document, "updates")];
      break;
    default:
      // Call base class method
      elements = dialogs.CommonDialog.prototype.getElements.call(this, aSpec);
  }

  return elements;
};

/**
 * Clicks on "Next" button and waits for the next page to show up
 */
UpdateWizardDialog.prototype.selectNextPage = function UMW_selectNextPage() {
    // Click the next button
  var next = this.getElement({type: "button", subtype: "next"});
  var page = this.currentPage;

  // Click 'Next' and wait until the next page has been selected
  next.waitThenClick();
  this.waitForWizardPageChanged(page);
};

/**
 * Waits for the given page of the update dialog wizard
 *
 * @param {String} aStep
 *        The wizard page id to change to
 * @param {Number} [aTimeout=5000]
 *        Timeout for the page to change
 */
UpdateWizardDialog.prototype.waitForWizardPage = function UWD_waitForWizardPage(aStep, aTimeout) {
  assert.waitFor(() => this.currentPage === aStep,
                 "New wizard page has been selected: " + aStep, aTimeout);
};

/**
 * Waits for the given page of the update dialog wizard to change
 *
 * @param {String} aStep
 *        The wizard page id to change from
 * @param {Number} [aTimeout=5000]
 *        Timeout for the page to change
 */
UpdateWizardDialog.prototype.waitForWizardPageChanged = function UWD_waitForWizardPageChanged(aStep, aTimeout) {
  assert.waitFor(() => this.currentPage !== aStep,
                 aStep + " is no longer the selected wizard page.", aTimeout);
};

/**
 * Wait until the download has been finished
 *
 * @param {Number} [aTimeout=360000]
 *        Timeout the download has to stop
 */
UpdateWizardDialog.prototype.waitforDownloadFinished = function UWD_waitForDownloadFinished(aTimeout=TIMEOUT_UPDATE_DOWNLOAD) {
  this.waitForWizardPageChanged(WIZARD_PAGES.downloading, aTimeout);

  assert.ok(this.currentPage !== WIZARD_PAGES.errors &&
            this.currentPage !== WIZARD_PAGES.errorextra,
            "Update successfully downloaded.");
};

/**
 * Handles the Update Wizard window
 *
 * @returns {UpdateWizardDialog} New instance of UpdateWizardDialog
 */
function handleUpdateWizardDialog() {
  var controller = windows.handleWindow("type", "Update:Wizard", undefined, false);

  return new UpdateWizardDialog(controller);
}

// Export of constants
exports.WIZARD_PAGES = WIZARD_PAGES;

// Export of classes
exports.UpdateWizardDialog =  UpdateWizardDialog;

// Export of methods
exports.handleUpdateWizardDialog = handleUpdateWizardDialog;
