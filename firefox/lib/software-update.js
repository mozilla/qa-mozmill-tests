/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * @fileoverview
 * The SoftwareUpdate API adds support for an easy access to the update process.
 */

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var addons = require("../../lib/addons");
var files = require("../../lib/files");
var prefs = require("prefs");
var utils = require("../../lib/utils");
var windows = require("../../lib/windows");

const TIMEOUT_UPDATE_APPLYING  = 300000;
const TIMEOUT_UPDATE_CHECK     = 30000;
const TIMEOUT_UPDATE_DOWNLOAD  = 360000;

const PREF_APP_DISTRIBUTION = "distribution.id";
const PREF_APP_DISTRIBUTION_VERSION = "distribution.version";
const PREF_APP_UPDATE_URL = "app.update.url";
const PREF_DISABLED_ADDONS = "extensions.disabledAddons";

const REGEX_UPDATE_CHANNEL_PREF = /("app\.update\.channel", ")([^"].*)(?=")/m;

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
 * Class to handle the allowed MAR channels as listed in update-settings.ini
 */
function MARChannels() {
  var file = Services.dirsvc.get("GreD", Ci.nsIFile);
  file.append("update-settings.ini");
  this._ini = new files.INIFile(file);
}

MARChannels.prototype = {
  /**
   * Get the currently allowed MAR channels
   *
   * @returns {string[]} List of MAR channels
   */
  get channels() {
    return this._read();
  },

  /**
   * Set the currently allowed MAR channels
   *
   * @param {string[]} aChannels
   *        List of MAR channels to set
   */
  set channels(aChannels) {
    return this._write(aChannels);
  },

  /**
   * Get a reference to the update-settings.ini file
   *
   * @returns {INIFile} Reference to INI file
   */
  get configFile() {
    return this._ini;
  },

  /**
   * Read allowed channels from INI file
   *
   * @returns {string[]} MAR Channels
   */
  _read: function MC_read() {
    var channels = this._ini.getValue("Settings", "ACCEPTED_MAR_CHANNEL_IDS");
    return channels.split(',');
  },

  /**
   * Write allowed channels to INI file
   *
   * @param {string[]} aChannels
   *        List of allowed channels
   */
  _write: function MC_write(aChannels) {
    this._ini.setValue("Settings", "ACCEPTED_MAR_CHANNEL_IDS",
                       aChannels.join(','));
  },

  /**
   * Add channels to the list of allowed channels
   *
   * @param {string} aChannels
   *        Channels to add
   */
  add: function MC_add(aChannels) {
    var channels = this._read();

    aChannels.forEach(aChannel => {
      if (channels.indexOf(aChannel) == -1) {
        channels.push(aChannel);
      }
    });

    this._write(channels);
  },

  /**
   * Remove channels from the list of allowed channels
   *
   * @param {string} aChannels
   *        Channels to remove
   */
  remove: function MC_remove(aChannels) {
    var channels = this._read();

    aChannels.forEach(aChannel => {
      var index = channels.indexOf(aChannel);
      if (index != -1) {
        channels.splice(index, 1);
      }
    });

    this._write(channels);
  }
};

/**
 * Constructor for software update class
 */
function SoftwareUpdate() {
  this._controller = null;
  this._wizard = null;
  this._downloadDuration = -1;

  this._aus = Cc["@mozilla.org/updates/update-service;1"]
              .getService(Ci.nsIApplicationUpdateService);
  this._ums = Cc["@mozilla.org/updates/update-manager;1"]
              .getService(Ci.nsIUpdateManager);

  this.marChannels = new MARChannels();
  this.updateChannel = new UpdateChannel();

  addons.submitInstalledAddons();
}

/**
 * Class for software updates
 */
SoftwareUpdate.prototype = {
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
      let macutils = Cc["@mozilla.org/xpcom/mac-utils;1"]
                     .getService(Ci.nsIMacUtils);

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
      channel : this.updateChannel.channel,
      disabled_addons : prefs.preferences.getPref(PREF_DISABLED_ADDONS, ''),
      locale : utils.appInfo.locale,
      mar_channels : this.marChannels.channels,
      url_aus : this.getUpdateURL(true),
      user_agent : utils.appInfo.userAgent,
      version : utils.appInfo.version
    };
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
        channel : this.updateChannel.channel,
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
   * @param {object} aUpdateData
   *        All the data collected during the update process
   */
  assertUpdateApplied : function SU_assertUpdateApplied(aUpdateData) {
    // Get the information from the last update
    var info = aUpdateData.updates[aUpdateData.update.index];

    // The upgraded version should be identical with the version given by
    // the update and we shouldn't have run a downgrade
    var check = Services.vc.compare(info.build_post.version, info.build_pre.version);
    expect.ok(check >= 0, "The version of the upgraded build is higher or equal");

    // If there was an update, the post build id should be identical with the patch
    if (info.patch.buildid) {
      expect.equal(info.build_post.buildid, info.patch.buildid,
                   "The post buildid is equal to the buildid of the update");
    }

    // If a target build id has been given, check if it matches the updated build
    info.target_buildid = aUpdateData.update.targetBuildID;
    if (info.target_buildid) {
      expect.equal(info.build_post.buildid, info.target_buildid,
                   "Post buildid matches target buildid of the update patch");
    }

    // An upgrade should not change the builds locale
    expect.equal(info.build_post.locale, info.build_pre.locale,
                 "The locale of the updated build has not been changed");

    // Check that no application-wide add-ons have been disabled
    expect.equal(info.build_post.disabled_addons, info.build_pre.disabled_addons,
                 "No application-wide add-ons have been disabled by the update");
  },

  /**
   * Check if the update button in the about window is visible and close the
   * window immediately, so we don't loose bandwidth when downloading the patch
   * via the secondary ui.
   *
   * @param {MozMillController} aBrowserController
   *        Controller of the browser window to spawn the about dialog
   */
  checkAboutDialog : function SU_checkAboutDialog(aBrowserController) {
    aBrowserController.mainMenu.click("#aboutName");
    windows.handleWindow("type", "Browser:About", function (aController) {
      var button = new elementslib.Selector(aController.window.document, "#updateButton");
      expect.ok(!button.getNode().hidden,
                "The update button is always visible even after an update.");
    }, true);
  },

  /**
   * Close the software update dialog
   */
  closeDialog: function SU_closeDialog() {
    if (this._controller) {
      this._controller.keypress(null, "VK_ESCAPE", {});
      this._controller.sleep(500);
      this._controller = null;
      this._wizard = null;
    }
  },

  /**
   * Download the update of the given channel and type
   *
   * @param {boolean} aWaitForFinish
   *        Sets if the function should wait until the download has been finished
   * @param {number} aTimeout
   *        Timeout the download has to stop
   */
  download : function SU_download(aWaitForFinish, aTimeout) {
    waitForFinish = aWaitForFinish ? aWaitForFinish : true;

    // Check that the correct channel has been set
    assert.equal(this.updateChannel.defaultChannel, this.updateChannel.channel,
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
          this.waitforDownloadFinished(aTimeout);

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
  forceFallback : function SU_forceFallback() {
    var updateStatus = this.stagingDirectory;
    updateStatus.append("update.status");

    var file = new files.File(updateStatus);
    file.contents = "failed: 6\n";
  },

  /**
   * Gets all the needed external DTD urls as an array
   *
   * @returns Array of external DTD urls
   * @type [string]
   */
  getDtds : function SU_getDtds() {
    var dtds = ["chrome://mozapps/locale/update/history.dtd",
                "chrome://mozapps/locale/update/updates.dtd"]
    return dtds;
  },

  /**
   * Retrieve an UI element based on the given spec
   *
   * @param {object} aSpec
   *        Information of the UI element which should be retrieved
   *        type: General type information
   *        subtype: Specific element or property
   *        value: Value of the element or property
   * @returns Element which has been created
   * @type {ElemBase}
   */
  getElement : function SU_getElement(aSpec) {
    var elem = null;

    switch(aSpec.type) {
      /**
       * subtype: subtype to match
       * value: value to match
       */
      case "button":
        elem = new elementslib.Lookup(this._controller.window.document,
                                      WIZARD_BUTTONS_BOX + WIZARD_BUTTON[aSpec.subtype]);
        break;
      case "wizard":
        elem = new elementslib.Lookup(this._controller.window.document, WIZARD);
        break;
      case "wizard_page":
        elem = new elementslib.Lookup(this._controller.window.document, WIZARD_DECK +
                                      '/id(' + aSpec.subtype + ')');
        break;
      case "download_progress":
        elem = new elementslib.ID(this._controller.window.document, "downloadProgress");
        break;
      default:
        assert.fail("Unknown element type - " + aSpec.type);
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
  getUpdateURL: function SU_getUpdateURL(aForce) {
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
    url = url.replace(/%CHANNEL%/g, this.updateChannel.channel);
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
   * @param {MozMillController} aBrowserController
   *        Mozmill controller of the browser window
   */
  openDialog: function SU_openDialog(aBrowserController) {
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

      // windows.handleWindow("type", "Browser:About", function(controller) {
      //  // Bug 599290
      //  // Check for updates has been completely relocated
      //  // into the about window. We can't check the in-about ui yet.
      //  var updateButton = new elementslib.ID(controller.window.document,
      //                                        "checkForUpdatesButton");
      //  //controller.click(updateButton);
      //  controller.waitForElement(updateButton, TIMEOUT);
      // });

      // For now just call the old ui until we have support for the about window.
      var updatePrompt = Cc["@mozilla.org/updates/update-prompt;1"]
                         .createInstance(Ci.nsIUpdatePrompt);
      updatePrompt.checkForUpdates();
    }
    else {
      // For builds <4.0b7pre
      aBrowserController.mainMenu.click("#checkForUpdates");
    }

    this.waitForDialogOpen(aBrowserController);
  },

  /**
   * Wait that check for updates has been finished
   * @param {number} aTimeout
   */
  waitForCheckFinished : function SU_waitForCheckFinished(aTimeout) {
    timeout = aTimeout ? aTimeout : TIMEOUT_UPDATE_CHECK;

    assert.waitFor(function() {
      return this.currentPage != WIZARD_PAGES.checking;
    }, "Check for updates has been completed.", timeout, null, this);
  },

  /**
   * Wait for the software update dialog
   *
   * @param {MozMillController} aBrowserController
   *        Mozmill controller of the browser window
   */
  waitForDialogOpen : function SU_waitForDialogOpen(aBrowserController) {
    this._controller = windows.handleWindow("type", "Update:Wizard",
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
   * @param {number} aTimeout
   *        Timeout the download has to stop
   */
  waitforDownloadFinished: function SU_waitForDownloadFinished(aTimeout) {
    timeout = aTimeout ? aTimeout : TIMEOUT_UPDATE_DOWNLOAD;

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
  waitForWizardPage : function SU_waitForWizardPage(aStep) {
    assert.waitFor(function () {
      return this.currentPage === aStep;
    }, "New wizard page has been selected", undefined, undefined, this);
  }
}

/**
 * Class to handle the update channel as listed in channel-prefs.js
 */
function UpdateChannel() {
  var file = Services.dirsvc.get("PrfDef", Ci.nsIFile);
  file.append("channel-prefs.js");

  this._file = new files.File(file);
}

UpdateChannel.prototype = {
  /**
   * Return the current update channel from the default branch
   *
   * @returns {string} Current update channel
   */
  get channel() {
    return prefs.preferences.getPref('app.update.channel', '', true, null);
  },

  /**
   * Get a reference to the update-settings.ini file
   *
   * @returns {INIFile} Reference to INI file
   */
  get configFile() {
    return this._file;
  },

  /**
   * Get the default update channel
   *
   * @returns {string} Current default update channel
   */
  get defaultChannel() {
    var result = this._file.contents.match(REGEX_UPDATE_CHANNEL_PREF);
    assert.equal(result.length, 3, "Update channel value has been found");

    return result[2];
  },

  /**
   * Set default update channel
   *
   * @param {string} aChannel
   *        New default update channel
   */
  set defaultChannel(aChannel) {
    assert.ok(typeof aChannel, "string", "Update channel has been specified");

    var contents = this._file.contents;
    contents = contents.replace(REGEX_UPDATE_CHANNEL_PREF, "$1" + aChannel);
    this._file.contents = contents;
  },
};


/**
 * Initialize all the data used by update tests
 *
 * @param {boolean} aFallback
 *        True in case it is a fallback update
 */
function initUpdateTests(aFallback=false) {
  var update = new SoftwareUpdate();

  // Prepare persisted object for update results
  // If an update fails the post build will be the same as the pre build.
  persisted.update.index = 0;
  persisted.update.stagingPath = update.stagingDirectory.path;

  // Create results object with information of the unmodified pre build
  // TODO: Lets change to persisted.update.results once the issue is fixed:
  // https://github.com/mozilla/mozmill-automation/issues/175
  persisted.updates = [{
    build_pre : update.buildInfo,
    build_post : update.buildInfo,
    fallback : aFallback,
    patch : {},
    success : false,
  }];

  // If requested modify the default update channel. It will be active
  // after the next restart of the application
  if (persisted.update.channel) {
    // Backup the original content and the path of the channel-prefs.js file
    persisted.update.default_update_channel = {
      content : update.updateChannel.configFile.contents,
      path : update.updateChannel.configFile.path
    };

    update.updateChannel.defaultChannel = persisted.update.channel;
  }

  // If requested modify the list of allowed MAR channels
  if (persisted.update.allowed_mar_channels) {
    // Backup the original content and the path of the update-settings.ini file
    persisted.update.default_mar_channels = {
      content : update.marChannels.configFile.contents,
      path : update.marChannels.configFile.path
    };

    update.marChannels.add(persisted.update.allowed_mar_channels);
  }
}


// Export of variables
exports.WIZARD_PAGES = WIZARD_PAGES;

// Export of functions
exports.initUpdateTests = initUpdateTests;

// Export of classes
exports.SoftwareUpdate = SoftwareUpdate;
