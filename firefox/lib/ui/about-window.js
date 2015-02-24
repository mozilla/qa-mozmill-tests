/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

Cu.import("resource://gre/modules/Services.jsm");

var softwareUpdate = require("../software-update");
var windows = require("../../../lib/windows");

var baseWindow = require("../../../lib/ui/base-window");
var updateWizard = require("update-wizard");

const WIZARD_PAGES = {
  checkForUpdates: "checkForUpdates",
  downloadAndInstall: "downloadAndInstall",
  apply: "apply",
  applyBillboard: "applyBillboard",
  checkingForUpdates: "checkingForUpdates",
  downloading: "downloading",
  applying: "applying",
  downloadFailed: "downloadFailed",
  adminDisabled: "adminDisabled",
  noUpdatesFound: "noUpdatesFound",
  otherInstanceHandlingUpdates: "otherInstanceHandlingUpdates",
  manualUpdate: "manualUpdate",
  unsupportedSystem: "unsupportedSystem"
};

const TIMEOUT_UPDATE_APPLY    = 300000;
const TIMEOUT_UPDATE_CHECK    = 30000;
const TIMEOUT_UPDATE_DOWNLOAD = 360000;

/**
 * AboutWindow class
 *
 * @constructor
 * @param {MozMillController} [aController]
 *        MozMillController of About Window
 */
function AboutWindow(aController) {
  baseWindow.BaseWindow.call(this, aController);

  this.softwareUpdate = new softwareUpdate.SoftwareUpdate();
  this._downloadDuration = -1;
}

AboutWindow.prototype = Object.create(baseWindow.BaseWindow.prototype);
AboutWindow.prototype.constructor = AboutWindow;

/**
 * Checks if updates were found
 *
 * @returns {Boolean} True if updates were found
 */
AboutWindow.prototype.__defineGetter__('updatesFound', function() {
  return this.wizardState !== WIZARD_PAGES.noUpdatesFound;
});

/**
 * Returns information about the active update in the queue.
 *
 * @returns {object} The information about the active update
 */
AboutWindow.prototype.__defineGetter__('patchInfo', function () {
  var patch = this.softwareUpdate.patchInfo;
  patch.download_duration = this._downloadDuration;

  return patch;
});

/**
 * Determine current state of updates
 *
 * @returns {String} The Id of the actual enabled element in updateDeck
 */
AboutWindow.prototype.__defineGetter__('wizardState', function() {
  var deck = this.getElement({type: "updateDeck"});
  deck.waitForElement();

  return deck.getNode().selectedPanel.id;
});

/**
 * Clicks on "Check for Updates" button, and waits for check to complete
 */
AboutWindow.prototype.checkForUpdates = function AW_checkForUpdates() {
  var checkButton = this.getElement({type: "checkForUpdatesButton"});
  checkButton.click();

  this.waitForCheckFinished();
};

/**
 * Download the update
 *
 * @param {Boolean} [aWaitForFinish=true]
 *        Sets if the function should wait until the download has been finished
 * @param {Number} [aTimeout=600s]
 *        Timeout until the download should finish
 */
AboutWindow.prototype.download = function AW_download(aWaitForFinish=true, aTimeout=TIMEOUT_UPDATE_DOWNLOAD) {
  // Check that the correct channel has been set
  assert.equal(this.softwareUpdate.updateChannel.defaultChannel,
               this.softwareUpdate.updateChannel.channel,
               "The update channel has been set correctly.");

  if (this.wizardState === WIZARD_PAGES.downloadAndInstall) {
    var installButton = this.getElement({type: "downloadAndInstallButton"});
    installButton.click();
    assert.waitFor(() => this.wizardState !== WIZARD_PAGES.downloadAndInstall);
  }

  // If there are incompatible addons we fallback on old software update dialog for updating
  if (this.wizardState === WIZARD_PAGES.applyBillboard) {
    var updateButton = this.getElement({type: "updateButton"});
    updateButton.waitThenClick();

    var wizard = updateWizard.handleUpdateWizardDialog();
    wizard.waitForWizardPage(updateWizard.WIZARD_PAGES.updatesfoundbasic);
    wizard.download();
    wizard.close();
    this._downloadDuration = wizard._downloadDuration;

    return;
  }

  if (aWaitForFinish) {
    var startTime = Date.now();
    this.waitForDownloadFinished(aTimeout);

    // Calculate the duration in ms
    this._downloadDuration = Date.now() - startTime;
  }
};

/**
 * Retrieve list of UI elements based on the given specification
 *
 * @param {object} [aSpec={}]
 *        Information of the UI elements which should be retrieved
 * @config {string} aSpec.type
 *         Identifier of the element
 *
 * @returns {ElemBase[]} Elements which have been found
 */
AboutWindow.prototype.getElements = function AW_getElements(aSpec={}) {
  var elements = [];

  switch (aSpec.type) {
    case "checkForUpdatesButton":
      elements = [findElement.ID(this._controller.window.document,
                                 "checkForUpdatesButton")];
      break;
    case "downloadAndInstallButton":
      elements = [findElement.ID(this._controller.window.document,
                                 "downloadAndInstallButton")];
      break;
    case "updateButton":
      elements = [findElement.ID(this._controller.window.document,
                                 "updateButton")];
      break;
    case "updateDeck":
      elements = [findElement.ID(this._controller.window.document,
                                 "updateDeck")];
      break;
    default:
      assert.fail("Unknown element type - " + aSpec.type);
  }

  return elements;
};

/**
 * Waits until checking for updates is done
 *
 * @param {Number} [aTimeout=360000]
 *        The amount of time to wait for check to complete
 */
AboutWindow.prototype.waitForCheckFinished = function AW_waitForCheckFinished(aTimeout=TIMEOUT_UPDATE_CHECK) {
  assert.waitFor(() => {
    return this.wizardState !== WIZARD_PAGES.checkForUpdates &&
           this.wizardState !== WIZARD_PAGES.checkingForUpdates;
  }, "An update has been found.", aTimeout);
};

/**
 * Waits until download is completed
 *
 * @param {Number} [aTimeout=360000]
 *        The amount of time to wait for download to complete
 */
AboutWindow.prototype.waitForDownloadFinished = function AW_waitForDownloadFinished(aTimeout=TIMEOUT_UPDATE_DOWNLOAD) {
  assert.waitFor(() => this.wizardState !== WIZARD_PAGES.downloading,
                 "Download has been completed.", aTimeout);

  assert.notEqual(this.wizardState, WIZARD_PAGES.downloadFailed,
                  "Update has been downloaded");
};

/**
 * Waits until the downloaded update has been applied
 *
 * @param {Number} [aTimeout=300000]
 *        The amount of time to wait for update to apply
 */
AboutWindow.prototype.waitForUpdateApplied = function AW_waitForUpdateApplied(aTimeout=TIMEOUT_UPDATE_APPLY) {
  assert.waitFor(() => this.wizardState === WIZARD_PAGES.apply,
                 "Final wizard page has been selected.");

  // Wait for update to be staged because for update tests we modify the update
  // status file to enforce the fallback update. If we modify the file before
  // Firefox does, Firefox will override our change and we will have no fallback update.
  assert.waitFor(() => this.softwareUpdate.activeUpdate.state.contains("applied"),
                 "Update has been applied.", aTimeout);
};

/**
 * Open the About window
 *
 * @param {function} aCallback
 *        Callback that opens the Browser:About window
 *
 * @returns {AboutWindow} New instance of AboutWindow
 */
function open(aCallback) {
  assert.ok(typeof aCallback === "function", "Callback has been provided");

  var controller = windows.waitForWindowState(aCallback, {type: "Browser:About", state: "open"});

  return new AboutWindow(controller);
}

// Export of constants
exports.WIZARD_PAGES = WIZARD_PAGES;

// Export of classes
exports.AboutWindow = AboutWindow;

// Export of methods
exports.open = open;
