/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

/**
 * @fileoverview
 * The SoftwareUpdate API adds support for an easy access to the update process.
 */

Cu.import("resource://gre/modules/Services.jsm");

// Include required modules
var addons = require("../../lib/addons");
var files = require("../../lib/files");
var prefs = require("../../lib/prefs");
var utils = require("../../lib/utils");
var windows = require("../../lib/windows");

const PREF_APP_DISTRIBUTION = "distribution.id";
const PREF_APP_DISTRIBUTION_VERSION = "distribution.version";
const PREF_APP_UPDATE_URL = "app.update.url";
const PREF_DISABLED_ADDONS = "extensions.disabledAddons";

const REGEX_UPDATE_CHANNEL_PREF = /("app\.update\.channel", ")([^"].*)(?=")/m;

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
      disabled_addons : prefs.getPref(PREF_DISABLED_ADDONS, ''),
      locale : utils.appInfo.locale,
      mar_channels : this.marChannels.channels,
      url_aus : this.getUpdateURL(true),
      user_agent : utils.appInfo.userAgent,
      version : utils.appInfo.version
    };
  },

  /**
   * Returns true if the offered update is a complete update
   */
  get isCompleteUpdate() {
    // Throw when isCompleteUpdate is called without an update. This should
    // never happen except if the test is incorrectly written.
    assert.ok(this.activeUpdate, "An active update has been found");

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
    var info = {
      channel : this.updateChannel.channel
    };

    if (this.activeUpdate) {
      info.buildid = this.activeUpdate.buildID;
      info.is_complete = this.isCompleteUpdate;
      info.size = this.activeUpdate.selectedPatch.size;
      info.type = this.activeUpdate.type;
      info.url_mirror = this.activeUpdate.selectedPatch.finalURL || "n/a";
      info.version = this.activeUpdate.version;
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
   * Checks if an update has been applied correctly
   *
   * @param {object} aUpdateData
   *        All the data collected during the update process
   */
  assertUpdateApplied : function SU_assertUpdateApplied(aUpdateData) {
    // Get the information from the last update
    var info = aUpdateData.updates[aUpdateData.update.index];

    // Set a variable for the outcome of the expect calls,
    // in order to assert it in the end
    var valid = 1;

    // The upgraded version should be identical with the version given by
    // the update and we shouldn't have run a downgrade
    var check = Services.vc.compare(info.build_post.version, info.build_pre.version);
    valid &= expect.ok(check >= 0,
                       "The version of the upgraded build is higher or equal");


    // If there was an update, the post build id should be identical with the patch
    if (info.patch.buildid) {
      valid &= expect.equal(info.build_post.buildid, info.patch.buildid,
                            "The post buildid is equal to the buildid of the update");
    }

    // If a target build id has been given, check if it matches the updated build
    info.target_buildid = aUpdateData.update.targetBuildID;
    if (info.target_buildid) {
      valid &= expect.equal(info.build_post.buildid, info.target_buildid,
                            "Post buildid matches target buildid of the update patch");
    }

    // An upgrade should not change the builds locale
    valid &= expect.equal(info.build_post.locale, info.build_pre.locale,
                          "The locale of the updated build has not been changed");

    // Check that no application-wide add-ons have been disabled
    valid &= expect.equal(info.build_post.disabled_addons, info.build_pre.disabled_addons,
                          "No application-wide add-ons have been disabled by the update");

    assert.equal(valid, 1, "Build has been upgraded successfully");
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
   * Retrieve the AUS update URL the update snippet is retrieved from
   *
   * @param {Boolean} aForce Flag to force an update check
   *
   * @returns {String} The URL of the update snippet
   */
  getUpdateURL: function SU_getUpdateURL(aForce) {
    var url = prefs.getPref(PREF_APP_UPDATE_URL, "");
    var dist = prefs.getPref(PREF_APP_DISTRIBUTION, "default", true, null);
    var dist_version = prefs.getPref(PREF_APP_DISTRIBUTION_VERSION,
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
    return prefs.getPref('app.update.channel', '', true, null);
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

// Export of functions
exports.initUpdateTests = initUpdateTests;

// Export of classes
exports.SoftwareUpdate = SoftwareUpdate;
