/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The SoftwareUpdateAPI adds support for an easy access to the update process.
 */

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var { assert, expect } = require("../../lib/assertions");
var addons = require("addons");
var prefs = require("prefs");
var utils = require("utils");

const TIMEOUT_UPDATE_APPLYING  = 300000;
const TIMEOUT_UPDATE_CHECK     = 30000;
const TIMEOUT_UPDATE_DOWNLOAD  = 360000;

const PREF_APP_DISTRIBUTION = "distribution.id";
const PREF_APP_DISTRIBUTION_VERSION = "distribution.version";
const PREF_APP_UPDATE_URL = "app.update.url";

const PREF_DISABLED_ADDONS = "extensions.disabledAddons";

// Helper lookup constants for elements of the software update dialog
const WIZARD = '/id("updates")';
const WIZARD_BUTTONS = WIZARD + '/anon({"anonid":"Buttons"})';
const WIZARD_DECK = WIZARD  + '/anon({"anonid":"Deck"})';

const WIZARD_PAGES = {
  dummy: 'dummy',
  checking: 'checking',
  pluginUpdatesFound: 'pluginupdatesfound',
  noUpdatesFound: 'noupdatesfound',
  manualUpdate: 'manualUpdate',
  incompatibleCheck: 'incompatibleCheck',
  updatesFoundBasic: 'updatesfoundbasic',
  updatesFoundBillboard: 'updatesfoundbillboard',
  license: 'license',
  incompatibleList: 'incompatibleList',
  downloading: 'downloading',
  errors: 'errors',
  errorPatching: 'errorpatching',
  finished: 'finished',
  finishedBackground: 'finishedBackground',
  installed: 'installed'
}

// On Mac there is another DOM structure used as on Windows and Linux
if (mozmill.isMac) {
  var WIZARD_BUTTONS_BOX = WIZARD_BUTTONS +
                             '/anon({"flex":"1"})/{"class":"wizard-buttons-btm"}/';
  var WIZARD_BUTTON = {
    back: '{"dlgtype":"back"}',
    next: '{"dlgtype":"next"}',
    cancel: '{"dlgtype":"cancel"}',
    finish: '{"dlgtype":"finish"}',
    extra1: '{"dlgtype":"extra1"}',
    extra2: '{"dlgtype":"extra2"}'
  }
}
else {
  var WIZARD_BUTTONS_BOX = WIZARD_BUTTONS +
                       '/anon({"flex":"1"})/{"class":"wizard-buttons-box-2"}/';
  var WIZARD_BUTTON = {
    back: '{"dlgtype":"back"}',
    next: 'anon({"anonid":"WizardButtonDeck"})/[1]/{"dlgtype":"next"}',
    cancel: '{"dlgtype":"cancel"}',
    finish: 'anon({"anonid":"WizardButtonDeck"})/[0]/{"dlgtype":"finish"}',
    extra1: '{"dlgtype":"extra1"}',
    extra2: '{"dlgtype":"extra2"}'
  }
}

/**
 * Constructor for software update class
 */
function softwareUpdate() {
  this._controller = null;
  this._wizard = null;
  this._downloadDuration = -1;

  this._aus = Cc["@mozilla.org/updates/update-service;1"].
              getService(Ci.nsIApplicationUpdateService);
  this._ums = Cc["@mozilla.org/updates/update-manager;1"].
              getService(Ci.nsIUpdateManager);

  addons.submitInstalledAddons();
}

/**
 * Class for software updates
 */
softwareUpdate.prototype = {
  /**
   * Get the customized ABI for the update service
   *
   * @returns {string} ABI version
   */
  get ABI() {
    let abi = null;
    try {
      abi = utils.appInfo.XPCOMABI;
    }
    catch (ex) {
      // throw?
    }

    if (mozmill.isMac) {
      let macutils = Cc["@mozilla.org/xpcom/mac-utils;1"].
                     getService(Ci.nsIMacUtils);

      if (macutils.isUniversalBinary)
        abi += "-u-" + macutils.architecturesInBinary;
    }

    return abi;
  },

  /**
   * Returns the active update
   *
   * @returns The currently selected update
   * @type nsIUpdate
   */
  get activeUpdate() {
    return this._ums.activeUpdate;
  },

  /**
   * Check if the user has permissions to run the software update
   *
   * @returns Status if the user has the permissions.
   * @type {boolean}
   */
  get allowed() {
    return this._aus.canCheckForUpdates && this._aus.canApplyUpdates;
  },

  /**
   * Returns information of the current build version
   */
  get buildInfo() {
    return {
      buildid : utils.appInfo.buildID,
      disabled_addons : prefs.preferences.getPref(PREF_DISABLED_ADDONS, ''),
      locale : utils.appInfo.locale,
      url_aus : this.getUpdateURL(true),
      user_agent : utils.appInfo.userAgent,
      version : utils.appInfo.version
    };
  },

  /**
   * Returns the current update channel from the default branch
   */
  get channel() {
    return prefs.preferences.getPref('app.update.channel', '', true, null);
  },

  /**
   * Get the controller of the associated engine manager dialog
   *
   * @returns Controller of the browser window
   * @type MozMillController
   */
  get controller() {
    return this._controller;
  },

  /**
   * Returns the current step of the software update dialog wizard
   */
  get currentPage() {
    return this._wizard.getNode().getAttribute('currentpageid');
  },

  /**
   * Returns true if the offered update is a complete update
   */
  get isCompleteUpdate() {
    // Throw when isCompleteUpdate is called without an update. This should
    // never happen except if the test is incorrectly written.
    assert.ok(this.activeUpdate, arguments.callee.name + ": isCompleteUpdate called " +
              "when activeUpdate is null!");

    var patchCount = this.activeUpdate.patchCount;
    assert.ok(patchCount === 1 || patchCount === 2,
              "An update must have one or two patches included.");

    // Ensure Partial and Complete patches produced have unique urls
    if (this.activeUpdate.patchCount == 2) {
      var patch0URL = this.activeUpdate.getPatchAt(0).URL;
      var patch1URL = this.activeUpdate.getPatchAt(1).URL;
      assert.notEqual(patch0URL, patch1URL,
                      "Partial and Complete download URLs are different");
    }

    return (this.activeUpdate.selectedPatch.type  == "complete");
  },

   /**
   * Returns information of the active update in the queue.
   */
  get patchInfo() {
    var info = { }

    if (this.activeUpdate) {
      info = {
        buildid : this.activeUpdate.buildID,
        channel : this.channel,
        is_complete : this.isCompleteUpdate,
        size : this.activeUpdate.selectedPatch.size,
        type : this.activeUpdate.type,
        url_mirror : this.activeUpdate.selectedPatch.finalURL || "n/a",
        download_duration : this._downloadDuration,
        version : this.activeUpdate.version
      };
    }

    return info;
  },

  /**
   * Returns information about the OS version
   *
   * @returns {String} OS version
   */
  get OSVersion() {
    let osVersion;
    try {
      osVersion = Services.sysinfo.getProperty("name") + " " +
                  Services.sysinfo.getProperty("version");
    }
    catch (ex) {
    }

    if (osVersion) {
      try {
        osVersion += " (" + Services.sysinfo.getProperty("secondaryLibrary") + ")";
      }
      catch (e) {
        // Not all platforms have a secondary widget library, so an error is nothing to worry about.
      }
      osVersion = encodeURIComponent(osVersion);
    }
    return osVersion;
  },

  /**
   * Returns the directory used for staging updates
   *
   * @returns {nsIFile} The staging directory
   */
  get stagingDirectory() {
    return this._aus.getUpdatesDirectory();
  },

  /**
   * Returns the update type (minor or major)
   *
   * @returns The update type
   */
  get updateType() {
    return this.activeUpdate.type;
  },

  /**
   * Check if updates have been found
   */
  get updatesFound() {
    return this.currentPage.indexOf("updatesfound") == 0;
  },

  /**
   * Checks if an update has been applied correctly
   *
   * @param {object} updateData
   *        All the data collected during the update process
   */
  assertUpdateApplied : function softwareUpdate_assertUpdateApplied(updateData) {
    // Get the information from the last update
    var info = updateData.updates[updateData.updateIndex];

    // The upgraded version should be identical with the version given by
    // the update and we shouldn't have run a downgrade
    var check = Services.vc.compare(info.build_post.version, info.build_pre.version);
    expect.ok(check >= 0, "The version of the upgraded build is higher or equal.");

    // The build id should be identical with the one from the update
    expect.equal(info.build_post.buildid, info.patch.buildid,
                 "The post buildid is equal to the buildid of the update.");

    // If a target build id has been given, check if it matches the updated build
    info.target_buildid = updateData.targetBuildID;
    if (info.target_buildid) {
      expect.equal(info.build_post.buildid, info.target_buildid,
                   "Post buildid matches target buildid of the update patch.");
    }

    // An upgrade should not change the builds locale
    expect.equal(info.build_post.locale, info.build_pre.locale,
                 "The locale of the updated build has not been changed.");

    // Check that no application-wide add-ons have been disabled
    expect.equal(info.build_post.disabled_addons, info.build_pre.disabled_addons,
                 "No application-wide add-ons have been disabled by the update.");
  },

  /**
   * Check if the update button in the about window is visible and close the
   * window immediately, so we don't loose bandwidth when downloading the patch
   * via the secondary ui.
   *
   * @param {MozMillController} aBrowserController
   *        Controller of the browser window to spawn the about dialog
   */
  checkAboutDialog : function softwareUpdate_checkAboutDialog(aBrowserController) {
    aBrowserController.mainMenu.click("#aboutName");
    utils.handleWindow("type", "Browser:About", function (controller) {
      var button = new elementslib.Selector(controller.window.document, "#updateButton");
      expect.ok(!button.getNode().hidden,
                "The update button is always visible even after an update.");
    }, true);
  },

  /**
   * Close the software update dialog
   */
  closeDialog: function softwareUpdate_closeDialog() {
    if (this._controller) {
      this._controller.keypress(null, "VK_ESCAPE", {});
      this._controller.sleep(500);
      this._controller = null;
      this._wizard = null;
    }
  },

  /**
   * Download the update of the given channel and type
   * @param {string} channel
   *        Update channel to use
   * @param {boolean} waitForFinish
   *        Sets if the function should wait until the download has been finished
   * @param {number} timeout
   *        Timeout the download has to stop
   */
  download : function softwareUpdate_download(channel, waitForFinish, timeout) {
    waitForFinish = waitForFinish ? waitForFinish : true;

    // Check that the correct channel has been set
    assert.equal(channel, this.channel,
                 "The update channel has been set correctly.");

    // Retrieve the timestamp, so we can measure the duration of the download
    var startTime = Date.now();

    // Click the next button
    var next = this.getElement({type: "button", subtype: "next"});
    var page = this.currentPage;

    // Click 'Next' and wait until the next page has been selected
    this._controller.click(next);
    assert.waitFor(function () {
      return this.currentPage !== page;
    }, "Update available page has been processed.", undefined, undefined, this);

    // If incompatible add-on are installed we have to skip over the wizard page
    if (this.currentPage === WIZARD_PAGES.incompatibleList) {
      this._controller.click(next);
      assert.waitFor(function () {
        return this.currentPage !== page;
      }, "Incompatible add-ons page has been skipped.", undefined, undefined, this);
    }

    // It can happen that a download has been already cached and the 'finished'
    // page gets directly shown. Make sure we react correctly for different pages.
    switch (this.currentPage) {
      case WIZARD_PAGES.downloading:
        if (waitForFinish) {
          this.waitforDownloadFinished(timeout);

          assert.waitFor(function () {
            return this.currentPage ===  WIZARD_PAGES.finished ||
                   this.currentPage === WIZARD_PAGES.finishedBackground;
          }, "Final wizard page has been selected.", undefined, undefined, this);

        }
        break;
      case WIZARD_PAGES.finished:
      case WIZARD_PAGES.finishedBackground:
        break;
      default:
        assert.fail("No handler for wizard page: " + this.currentPage);
    }

    // Calculate the duration in ms
    this._downloadDuration = Date.now() - startTime;
  },

  /**
   * Update the update.status file and set the status to 'failed:6'
   */
  forceFallback : function softwareUpdate_forceFallback() {
    var updateStatus = this.stagingDirectory;
    updateStatus.append("update.status");

    var foStream = Cc["@mozilla.org/network/file-output-stream;1"].
                   createInstance(Ci.nsIFileOutputStream);
    var status = "failed: 6\n";
    foStream.init(updateStatus, 0x02 | 0x08 | 0x20, -1, 0);
    foStream.write(status, status.length);
    foStream.close();
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function softwareUpdate_getDtds() {
    var dtds = ["chrome://mozapps/locale/update/history.dtd",
                "chrome://mozapps/locale/update/updates.dtd"]
    return dtds;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} spec
   *        Information of the UI element which should be retrieved
   *        type: General type information
   *        subtype: Specific element or property
   *        value: Value of the element or property
   * @returns Element which has been created
   * @type {ElemBase}
   */
  getElement : function softwareUpdate_getElement(spec) {
    var elem = null;

    switch(spec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
      case "button":
        elem = new elementslib.Lookup(this._controller.window.document,
                                      WIZARD_BUTTONS_BOX + WIZARD_BUTTON[spec.subtype]);
        break;
      case "wizard":
        elem = new elementslib.Lookup(this._controller.window.document, WIZARD);
        break;
      case "wizard_page":
        elem = new elementslib.Lookup(this._controller.window.document, WIZARD_DECK +
                                      '/id(' + spec.subtype + ')');
        break;
      case "download_progress":
        elem = new elementslib.ID(this._controller.window.document, "downloadProgress");
        break;
      default:
        assert.fail("Unknown element type - " + spec.type);
    }

    return elem;
  },

  /**
   * Retrieve the AUS update URL the update snippet is retrieved from
   *
   * @param {Boolean} aForce Flag to force an update check
   *
   * @returns {String} The URL of the update snippet
   */
  getUpdateURL: function softwareUpdate_getUpdateURL(aForce) {
    var url = prefs.preferences.getPref(PREF_APP_UPDATE_URL, "");
    var dist = prefs.preferences.getPref(PREF_APP_DISTRIBUTION,
                                         "default", true, null);
    var dist_version = prefs.preferences.getPref(PREF_APP_DISTRIBUTION_VERSION,
                                                 "default", true, null);

    if (!url || url == "") {
      return null;
    }

    // Not all placeholders are getting replaced correctly by formatURL
    url = url.replace(/%PRODUCT%/g, utils.appInfo.name);
    url = url.replace(/%BUILD_ID%/g, utils.appInfo.buildID);
    url = url.replace(/%BUILD_TARGET%/g, utils.appInfo.os + "_" + this.ABI);
    url = url.replace(/%OS_VERSION%/g, this.OSVersion);
    url = url.replace(/%CHANNEL%/g, this.channel);
    url = url.replace(/%DISTRIBUTION%/g, dist);
    url = url.replace(/%DISTRIBUTION_VERSION%/g, dist_version);

    url = utils.formatUrl(url);

    if (aForce)
      url += (url.indexOf("?") != -1 ? "&" : "?") + "force=1";

    return url;
  },

  /**
   * Open software update dialog
   *
   * @param {MozMillController} browserController
   *        Mozmill controller of the browser window
   */
  openDialog: function softwareUpdate_openDialog(browserController) {
    // TODO: After Firefox 4 has been released and we do not have to test any
    // beta release anymore uncomment out the following code

    // With version >= 4.0b7pre the update dialog is reachable from within the
    // about window now.
    var appVersion = utils.appInfo.version;

    if (Services.vc.compare(appVersion, "4.0b7pre") >= 0) {
      // We can't open the about window, otherwise a parallel download of
      // the update will let us fallback to a complete one all the time

      // Open the about window and check the update button
      // browserController.mainMenu.click("#aboutName");

      // utils.handleWindow("type", "Browser:About", function(controller) {
      //  // Bug 599290
      //  // Check for updates has been completely relocated
      //  // into the about window. We can't check the in-about ui yet.
      //  var updateButton = new elementslib.ID(controller.window.document,
      //                                        "checkForUpdatesButton");
      //  //controller.click(updateButton);
      //  controller.waitForElement(updateButton, TIMEOUT);
      // });

      // For now just call the old ui until we have support for the about window.
      var updatePrompt = Cc["@mozilla.org/updates/update-prompt;1"].
                         createInstance(Ci.nsIUpdatePrompt);
      updatePrompt.checkForUpdates();
    }
    else {
      // For builds <4.0b7pre
      browserController.mainMenu.click("#checkForUpdates");
    }

    this.waitForDialogOpen(browserController);
  },

  /**
   * Wait that check for updates has been finished
   * @param {number} timeout
   */
  waitForCheckFinished : function softwareUpdate_waitForCheckFinished(timeout) {
    timeout = timeout ? timeout : TIMEOUT_UPDATE_CHECK;

    assert.waitFor(function() {
      return this.currentPage != WIZARD_PAGES.checking;
    }, "Check for updates has been completed.", timeout, null, this);
  },

  /**
   * Wait for the software update dialog
   *
   * @param {MozMillController} browserController
   *        Mozmill controller of the browser window
   */
  waitForDialogOpen : function softwareUpdate_waitForDialogOpen(browserController) {
    this._controller = utils.handleWindow("type", "Update:Wizard",
                                          undefined, false);
    this._wizard = this.getElement({type: "wizard"});

    assert.waitFor(function () {
      return this.currentPage !== WIZARD_PAGES.dummy;
    }, "Dummy wizard page has been made invisible", undefined, undefined, this);

    this._controller.window.focus();
  },

  /**
   * Wait until the download has been finished
   *
   * @param {number} timeout
   *        Timeout the download has to stop
   */
  waitforDownloadFinished: function softwareUpdate_waitForDownloadFinished(timeout) {
    timeout = timeout ? timeout : TIMEOUT_UPDATE_DOWNLOAD;

    var progress =  this.getElement({type: "download_progress"});
    assert.waitFor(function () {
      return this.currentPage !== WIZARD_PAGES.downloading ||
             progress.getNode().value === '100';
    }, "Update has been finished downloading.", timeout, undefined, this);

    assert.notEqual(this.currentPage, WIZARD_PAGES.errors,
                    "Update successfully downloaded.");

    // We instantly apply the downloaded update
    assert.waitFor(function () {
      return this.currentPage !== WIZARD_PAGES.downloading;
    }, "Downloaded update has been applied.", TIMEOUT_UPDATE_APPLYING, undefined, this);
  },

  /**
   * Waits for the given page of the update dialog wizard
   */
  waitForWizardPage : function softwareUpdate_waitForWizardPage(step) {
    assert.waitFor(function () {
      return this.currentPage === step;
    }, "New wizard page has been selected", undefined, undefined, this);
  }
}

// Export of variables
exports.WIZARD_PAGES = WIZARD_PAGES;

// Export of classes
exports.softwareUpdate = softwareUpdate;
